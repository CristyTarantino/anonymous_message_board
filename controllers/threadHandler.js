const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 13;
const Thread = require("../models/Thread");

class ThreadHandler {
  async getThreads(board) {
    if (!board || board === "") throw Error("board name is a required field");

    try {
      // most recent 10 bumped thread with only the most recent 3 replies
      return await Thread.find({ board }, { replies: { $slice: 3 } })
        .sort({ bumped_on: -1 })
        .limit(10)
        .exec();
    } catch (e) {
      throw e;
    }
  }

  async createThread(text, delete_password, board) {
    if (!text || text === "") throw Error("thread name is a required field");

    if (!board || board === "") throw Error("board name is a required field");

    if (delete_password && delete_password !== "") {
      try {
        var thread = new Thread({
          board,
          text,
          delete_password
        });

        // save user to database
        return await thread.save();
      } catch (e) {
        throw e;
      }
    } else {
      throw Error("password is a required field");
    }
  }

  async reportThread(thread_id) {
    if (!thread_id || thread_id === "")
      throw Error("cannot report a thread without its id");

    try {
      const threadData = await Thread.findByIdAndUpdate(
        thread_id,
        { $set: { reported: true } },
        { useFindAndModify: false }
      );

      if (threadData) return "success";

      throw Error("cannot report this thread");
    } catch (e) {
      console.log(e);
      throw Error("cannot report this thread");
    }
  }

  async deleteThread(thread_id, delete_password) {
    if (!thread_id || thread_id === "")
      throw Error("thread id is a required field");

    if (!delete_password || delete_password === "")
      throw Error("password is a required field");

    try {
      const thread = await Thread.findById(thread_id);

      if (bcrypt.compareSync(delete_password, thread.delete_password)) {
        await thread.remove();
        return "success";
      }

      throw Error("incorrect password");
    } catch (e) {
      throw e;
    }
  }

  async getReplysList(thred_id) {
    if (!thred_id || thred_id === "")
      throw Error("thread id is a required field");

    try {
      return await Thread.findById(thred_id);
    } catch (e) {
      throw e;
    }
  }

  async createReply(thread_id, text, delete_password) {
    if (!text || text === "") throw Error("reply text is a required field");
    if (!delete_password || delete_password === "")
      throw Error("password is a required field");

    try {
      const hashedPassword = bcrypt.hashSync(
        delete_password,
        bcrypt.genSaltSync(SALT_ROUNDS)
      );

      const newReplies = {
        _id: new mongoose.mongo.ObjectId(),
        text,
        created_on: new Date(),
        delete_password: hashedPassword,
        reported: false
      };

      return await Thread.findOneAndUpdate(
        { _id: thread_id },
        {
          $inc: { replycount: 1 },
          $push: {
            replies: {
              $each: [newReplies],
              $sort: { created_on: -1 }
            }
          }
        },
        {
          useFindAndModify: false
        }
      );
    } catch (e) {
      throw e;
    }
  }

  async reportReply(thread_id, reply_id) {
    if (!thread_id || thread_id === "")
      throw Error("thread id is a required field");

    if (!reply_id || reply_id === "")
      throw Error("reply id is a required field");

    try {
      const data = await Thread.findOneAndUpdate(
        { _id: thread_id, "replies._id": mongoose.mongo.ObjectId(reply_id) },
        { $set: { "replies.$.reported": true } },
        {
          useFindAndModify: false
        }
      );

      if (data) return "success";

      throw Error("cannot report this reply");
    } catch (e) {
      throw e;
    }
  }

  async deleteReply(thread_id, reply_id, delete_password) {
    if (!thread_id || thread_id === "")
      throw Error("thread id is a required field");

    if (!reply_id || reply_id === "")
      throw Error("reply id is a required field");

    if (!delete_password || delete_password === "")
      throw Error("password is a required field");

    try {
      const data = await Thread.findById(thread_id);
      
      if (
        bcrypt.compareSync(
          delete_password,
          data.replies.find(r => r._id == reply_id).delete_password
        )
      ) {
        const updatedData = await Thread.updateOne({'replies._id': mongoose.mongo.ObjectId(reply_id)}, {
          $set: {
            "replies.$.text": "[deleted]"
          }
        });
        
        if (updatedData) return "success";
        
        throw Error("cannot delete this reply");
      }

      throw Error("incorrect password");
    } catch (e) {
      throw e
    }
  }
}

module.exports = new ThreadHandler();
