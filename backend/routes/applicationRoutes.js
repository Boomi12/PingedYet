const express = require('express');
const router = express.Router();
const { 
  getApplications, 
  createApplication, 
  getApplicationById, 
  updateApplication, 
  deleteApplication 
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

// Wrap all application routes in the protect middleware
router.use(protect);

// CRUD routes
router.route('/')
  .get(getApplications)
  .post(createApplication);

router.route('/:id')
  .get(getApplicationById)
  .put(updateApplication)
  .delete(deleteApplication);

module.exports = router;
