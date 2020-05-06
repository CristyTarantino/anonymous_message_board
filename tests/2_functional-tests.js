/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */
var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");
const Thread = require("../models/Thread");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  const testBoard = Math.random()
    .toString(36)
    .substring(7);

  const testThread = Math.random()
    .toString(36)
    .substring(7);

  after(async () => {
    return await Thread.deleteMany({ board: testBoard });
  });

  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("POST one new threads to board " + testBoard, done => {
        chai
          .request(server)
          .post("/api/threads/" + testBoard)
          .send({
            text: "test text" + testBoard,
            delete_password: "text_password",
            board: testBoard
          })
          .end(() => {
            chai
              .request(server)
              .get("/api/threads/" + testBoard + "/")
              .end((err, res) => {
                assert.equal(
                  res.body.some(
                    thread => thread.text === "test text" + testBoard
                  ),
                  true
                );
                done();
              });
          });
      });
    });

    suite("GET", function() {
      beforeEach(async () => {
        return await Promise.all([
          chai
            .request(server)
            .post("/api/threads/" + testBoard)
            .send({
              text: "test text1",
              delete_password: "delete1",
              board: testBoard
            }),
          chai
            .request(server)
            .post("/api/threads/" + testBoard)
            .send({
              text: "test text2",
              delete_password: "delete2",
              board: testBoard
            })
        ]);
      });

      test("GET 10 most recent bumped threads with 3 most recent replies", function(done) {
        chai
          .request(server)
          .get("/api/threads/" + testBoard + "/")
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            assert.isArray(res.body[0].replies);
            assert.isAtMost(res.body[0].replies.length, 3);
            done();
          });
      });
    });

    suite("DELETE", function() {
      let idToDelete;

      beforeEach(done => {
        chai
          .request(server)
          .post("/api/threads/" + testBoard)
          .send({
            text: "test text 1" + testBoard,
            delete_password: "text_password",
            board: testBoard
          })
          .end(() => {
            chai
              .request(server)
              .get("/api/threads/" + testBoard + "/")
              .end((err, res) => {
                idToDelete = res.body.filter(
                  thread => thread.text === "test text 1" + testBoard
                )[0]._id;
                done();
              });
          });
      });

      test('DELETE with wrong password returns "incorrect password"', function(done) {
        chai
          .request(server)
          .delete("/api/threads/" + testBoard + "/")
          .send({ thread_id: idToDelete, delete_password: "wrong" })
          .end((err, res) => {
            assert.equal(res.status, 400);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });
      test('DELETE with correct password returns "success"', function(done) {
        chai
          .request(server)
          .delete("/api/threads/" + testBoard + "/")
          .send({ thread_id: idToDelete, delete_password: "text_password" })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, "success");
            done();
          });
      });
    });

    suite("PUT", function() {
      let idToReport;

      beforeEach(done => {
        chai
          .request(server)
          .post("/api/threads/" + testBoard)
          .send({
            text: "test text 2" + testBoard,
            delete_password: "text_password",
            board: testBoard
          })
          .end(() => {
            chai
              .request(server)
              .get("/api/threads/" + testBoard + "/")
              .end((err, res) => {
                idToReport = res.body.filter(
                  thread => thread.text === "test text 2" + testBoard
                )[0]._id;
                done();
              });
          });
      });

      test('PUT with thread_id to report thread returns "success"', function(done) {
        chai
          .request(server)
          .put("/api/threads/" + testBoard + "/")
          .send({ thread_id: idToReport })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, "success");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    let threadIdToReplay;
    let replyIdToActOn;

    beforeEach(done => {
      chai
        .request(server)
        .post("/api/threads/" + testBoard)
        .send({
          text: "test text 2 " + testThread,
          delete_password: "text_password",
          board: testBoard
        })
        .end(() => {
          chai
            .request(server)
            .get("/api/threads/" + testBoard)
            .end((err, res) => {
              threadIdToReplay = res.body.filter(
                thread => thread.text === "test text 2 " + testThread
              )[0]._id;

              chai
                .request(server)
                .post("/api/replies/" + testBoard)
                .send({
                  text: "first reply test " + testThread,
                  delete_password: "deletereply",
                  thread_id: threadIdToReplay
                });

              done();
            });
        });
    });

    suite("POST", function() {
      test("POST a reply to a thread", function(done) {
        chai
          .request(server)
          .post("/api/replies/" + testBoard)
          .send({
            text: "first reply test " + testThread,
            delete_password: "deletereply",
            thread_id: threadIdToReplay
          })
          .end((err, res) => {
            chai
              .request(server)
              .get("/api/replies/" + testBoard)
              .query({ thread_id: threadIdToReplay })
              .end((err, res) => {
                assert.equal(
                  res.body.replies.some(
                    r => r.text === "first reply test " + testThread
                  ),
                  true
                );
                assert.equal(
                  Date.parse(res.body.bumped_on) >
                    Date.parse(res.body.created_on),
                  true
                );
                assert.isAtLeast(res.body.replies.length, 1);
                assert.isAtLeast(res.body.replycount, 1);
                done();
              });
          });
      });
    });

    suite("GET", function() {
      test("GET thread with all replies", function(done) {
        chai
          .request(server)
          .get("/api/replies/" + testThread)
          .query({ thread_id: threadIdToReplay })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body.replies);
            done();
          });
      });
    });

    suite("PUT", function() {
      let replyIdToActOn;

      beforeEach(function(done) {
        chai
          .request(server)
          .post("/api/replies/" + testBoard)
          .send({
            text: "first reply test 2" + testThread,
            delete_password: "deletereply",
            thread_id: threadIdToReplay
          })
          .end((err, res) => {
            chai
              .request(server)
              .get("/api/replies/" + testBoard)
              .query({ thread_id: threadIdToReplay })
              .end((err, res) => {
                replyIdToActOn = res.body.replies.filter(
                  r => r.text === "first reply test 2" + testThread
                )[0]._id;
                done();
              });
          });
      });

      test('PUT thread_id & reply_id to report a thread, returned is "success"', function(done) {
        chai
          .request(server)
          .put("/api/replies/" + testThread)
          .send({ thread_id: threadIdToReplay, reply_id: replyIdToActOn })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, "success");
            done();
          });
      });
    });

    suite("DELETE", function() {
      let replyIdToActOn;

      beforeEach(function(done) {
        chai
          .request(server)
          .post("/api/replies/" + testBoard)
          .send({
            text: "first reply test 2" + testThread,
            delete_password: "deletereply",
            thread_id: threadIdToReplay
          })
          .end((err, res) => {
            chai
              .request(server)
              .get("/api/replies/" + testBoard)
              .query({ thread_id: threadIdToReplay })
              .end((err, res) => {
                replyIdToActOn = res.body.replies.filter(
                  r => r.text === "first reply test 2" + testThread
                )[0]._id;
                done();
              });
          });
      });
      test('DELETE reply passing incorrect password returns "incorrect password"', function(done) {
        chai
          .request(server)
          .delete("/api/replies/" + testThread)
          .send({
            thread_id: threadIdToReplay,
            reply_id: replyIdToActOn,
            delete_password: "wrong"
          })
          .end((err, res) => {
            assert.equal(res.status, 400);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test('DELETE reply passing correct password returns "success"', function(done) {
        chai
          .request(server)
          .delete("/api/replies/" + testThread)
          .send({
            thread_id: threadIdToReplay,
            reply_id: replyIdToActOn,
            delete_password: "deletereply"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body, "success");
            done();
          });
      });
    });
  });
});
