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

router.get('/', protect, getStudents);
router.post('/', protect, createStudent);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);
router.post('/:id/absence', protect, reportAbsence);

module.exports = router;
