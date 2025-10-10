const express = require('express');
const router = express.Router();

const controller = require('../controller/report_comment');


router.get("/historyreport/:id",controller.getHistoryReport)
router.post('/report/comment', controller.createReportForComment);
router.post('/report/reply', controller.createReportForReply);
router.post('/report/event-comment', controller.createEventReportForComment);
router.post('/report/event-reply', controller.createEventReportForReply);
router.get('/report/comments', controller.getAllReports);
router.get('/report/me/:userId', controller.getReportsForUser);
router.get('/report/my/:userId', controller.getReportsByReporter);
router.patch('/report/:id/status', controller.updateReportStatus);


module.exports = router;
