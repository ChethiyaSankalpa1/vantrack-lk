const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  reportAbsence,
} = require('../controllers/studentController');

const absenceController = require('../controllers/absenceController');

router.get('/', protect, getStudents);
router.post('/', protect, createStudent);
router.get('/absences/:absenceId/cancel', protect, absenceController.cancelAbsenceReport);
router.patch('/absences/:absenceId/cancel', protect, absenceController.cancelAbsenceReport);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);
router.post('/:id/absence', protect, reportAbsence);
router.post('/:studentId/absence-report', protect, absenceController.submitAbsenceReport);
router.get('/:studentId/absences', protect, absenceController.getStudentAbsences);

module.exports = router;
