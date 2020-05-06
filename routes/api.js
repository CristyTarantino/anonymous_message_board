/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
// Import our Controllers
const ThreadHandler = require("../controllers/threadHandler.js");

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    // list recent threads
    .get((req, res) => {
      const { board } = req.params;
      ThreadHandler
        .getThreads(board)
        .then(data => res.status(200).json(data))
        .catch(e => res.status(400).send(e.message));
    })
    // create thread
    .post((req, res) => {
      const { text, delete_password } = req.body;   
      const board = req.body.board || req.params.board;
      ThreadHandler
        .createThread(text, delete_password, board)
        .then(() => res.redirect("/b/" + board))
        .catch(e => res.status(400).send(e.message));
    })
    // report a thread
    .put((req, res) => {
      const thread_id = req.body.thread_id || req.body.report_id;
    
      ThreadHandler
        .reportThread(thread_id)
        .then(message => res.status(200).json(message))
        .catch(e => res.status(400).json(e.message));
    })
    // delete a thread with password
    .delete((req, res) => {
      const { thread_id, delete_password } = req.body;
      ThreadHandler
        .deleteThread(thread_id, delete_password)
        .then(data => res.status(200).json(data))
        .catch(e => res.status(400).send(e.message));
    });

  app
    .route("/api/replies/:board")
    // show all replies on thread
    .get((req, res) => {
      const thred_id = req.query.thread_id;
      ThreadHandler
        .getReplysList(thred_id)
        .then(data => res.status(200).json(data))
        .catch(e => res.status(400).send(e.message));
    })
    // create reply
    .post((req, res) => {
      const { thread_id, text, delete_password } = req.body;
      const { board } = req.params;
      ThreadHandler
        .createReply(thread_id, text, delete_password)
        .then(data => res.redirect('/b/' + board + '/' + thread_id))
        .catch(e => res.status(400).send(e.message));
    })
    // report a reply on thread
    .put((req, res) => {
      const { thread_id, reply_id } = req.body;
      ThreadHandler
        .reportReply(thread_id, reply_id)
        .then(data => res.status(200).json(data))
        .catch(e => res.status(400).send(e.message));
    })
    // change reply to [deleted] on thread
    .delete((req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      ThreadHandler
        .deleteReply(thread_id, reply_id, delete_password)
        .then(data => res.status(200).json(data))
        .catch(e => res.status(400).send(e.message));
    });
};
