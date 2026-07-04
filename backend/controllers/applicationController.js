const Application = require('../models/Application');

/**
 * @desc    Get all applications for the logged-in user
 * @route   GET /api/applications
 * @access  Private
 */
const getApplications = async (req, res) => {
  try {
    // Return only applications that match the logged-in user's ID
    // Sort by orderIndex first, then by createdAt newest first
    const applications = await Application.find({ userId: req.user.id })
      .sort({ orderIndex: 1, createdAt: -1 });
    return res.json(applications);
  } catch (error) {
    console.error('[Application Controller] Get error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving applications' });
  }
};

/**
 * @desc    Create a new application
 * @route   POST /api/applications
 * @access  Private
 */
const createApplication = async (req, res) => {
  const { 
    companyName, 
    role, 
    platform, 
    platformAppliedFrom, 
    appliedDate, 
    interviewDate, 
    status, 
    notes,
    notificationId,
    workMode,
    stipendAmount,
    workLocation,
    duration
  } = req.body;

  try {
    // Validation
    if (!companyName || !role || !appliedDate) {
      return res.status(400).json({ message: 'Company name, role, and applied date are required' });
    }

    // Date format validations
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appliedDate)) {
      return res.status(400).json({ message: 'Applied date must be in YYYY-MM-DD format' });
    }
    if (interviewDate && !dateRegex.test(interviewDate)) {
      return res.status(400).json({ message: 'Interview date must be in YYYY-MM-DD format' });
    }
    if (interviewDate && new Date(interviewDate) < new Date(appliedDate)) {
      return res.status(400).json({ message: 'Interview date cannot be before applied date' });
    }

    // Stipend validation
    if (stipendAmount !== undefined && stipendAmount !== null && stipendAmount !== '') {
      if (isNaN(Number(stipendAmount))) {
        return res.status(400).json({ message: 'Stipend amount must be a valid number' });
      }
    }

    // Work mode validation
    if (workMode && !['Work From Home', 'In-Office', 'Hybrid'].includes(workMode)) {
      return res.status(400).json({ message: 'Invalid work mode option' });
    }

    // Map platforms gracefully to accept both frontend field variations
    const finalPlatform = platform || platformAppliedFrom || 'Direct/Other';

    const application = await Application.create({
      userId: req.user.id, // Linked to the authenticated user from JWT
      companyName,
      role,
      platform: finalPlatform,
      appliedDate,
      interviewDate: interviewDate || null,
      status: status || 'Applied',
      notes: notes || '',
      notificationId: notificationId || null,
      workMode: workMode || null,
      stipendAmount: (stipendAmount !== undefined && stipendAmount !== null && stipendAmount !== '') ? Number(stipendAmount) : null,
      workLocation: workLocation || '',
      duration: duration || '',
    });

    return res.status(201).json(application);
  } catch (error) {
    console.error('[Application Controller] Create error:', error.message);
    return res.status(500).json({ message: 'Server error creating application' });
  }
};

/**
 * @desc    Get a single application by ID
 * @route   GET /api/applications/:id
 * @access  Private
 */
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!application) {
      return res.status(404).json({ message: 'Application tracker not found or access denied' });
    }

    return res.json(application);
  } catch (error) {
    console.error('[Application Controller] GetById error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving application' });
  }
};

/**
 * @desc    Update an application
 * @route   PUT /api/applications/:id
 * @access  Private
 */
const updateApplication = async (req, res) => {
  const { 
    companyName, 
    role, 
    platform, 
    platformAppliedFrom, 
    appliedDate, 
    interviewDate, 
    status, 
    notes,
    notificationId,
    workMode,
    stipendAmount,
    workLocation,
    duration
  } = req.body;

  try {
    const application = await Application.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!application) {
      return res.status(404).json({ message: 'Application tracker not found or access denied' });
    }

    // Form validations
    if (companyName === '') {
      return res.status(400).json({ message: 'Company name cannot be blank' });
    }
    if (role === '') {
      return res.status(400).json({ message: 'Role cannot be blank' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (appliedDate !== undefined && !dateRegex.test(appliedDate)) {
      return res.status(400).json({ message: 'Applied date must be in YYYY-MM-DD format' });
    }
    if (interviewDate && !dateRegex.test(interviewDate)) {
      return res.status(400).json({ message: 'Interview date must be in YYYY-MM-DD format' });
    }

    const targetAppliedDate = appliedDate !== undefined ? appliedDate : application.appliedDate;
    const targetInterviewDate = interviewDate !== undefined ? interviewDate : application.interviewDate;

    if (targetInterviewDate && targetAppliedDate && new Date(targetInterviewDate) < new Date(targetAppliedDate)) {
      return res.status(400).json({ message: 'Interview date cannot be before applied date' });
    }

    // Stipend validation
    if (stipendAmount !== undefined && stipendAmount !== null && stipendAmount !== '') {
      if (isNaN(Number(stipendAmount))) {
        return res.status(400).json({ message: 'Stipend amount must be a valid number' });
      }
    }

    // Work mode validation
    if (workMode && !['Work From Home', 'In-Office', 'Hybrid'].includes(workMode)) {
      return res.status(400).json({ message: 'Invalid work mode option' });
    }

    // Update fields conditionally if provided in request body
    if (companyName !== undefined) application.companyName = companyName;
    if (role !== undefined) application.role = role;
    if (platform !== undefined) application.platform = platform;
    else if (platformAppliedFrom !== undefined) application.platform = platformAppliedFrom;
    
    if (appliedDate !== undefined) application.appliedDate = appliedDate;
    if (interviewDate !== undefined) application.interviewDate = interviewDate || null;
    if (status !== undefined) application.status = status;
    if (notes !== undefined) application.notes = notes;
    if (notificationId !== undefined) application.notificationId = notificationId;
    
    if (workMode !== undefined) application.workMode = workMode || null;
    if (stipendAmount !== undefined) {
      application.stipendAmount = (stipendAmount !== null && stipendAmount !== '') ? Number(stipendAmount) : null;
    }
    if (workLocation !== undefined) application.workLocation = workLocation || '';
    if (duration !== undefined) application.duration = duration || '';

    const updatedApplication = await application.save();
    return res.json(updatedApplication);
  } catch (error) {
    console.error('[Application Controller] Update error:', error.message);
    return res.status(500).json({ message: 'Server error updating application' });
  }
};

/**
 * @desc    Delete an application
 * @route   DELETE /api/applications/:id
 * @access  Private
 */
const deleteApplication = async (req, res) => {
  const { id } = req.params;
  console.log('[Backend] DELETE /api/applications/:id hit. ID:', id);
  console.log('[Backend] Authorized User ID:', req.user?.id);

  try {
    const application = await Application.findOneAndDelete({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!application) {
      console.warn('[Backend] DELETE failed: Application not found or not authorized for ID:', id);
      return res.status(404).json({ message: 'Application not found or not authorized.' });
    }

    console.log('[Backend] DELETE success for ID:', id);
    return res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('[Backend] DELETE error failed:', error.message);
    return res.status(500).json({ message: 'Server error deleting application' });
  }
};

/**
 * @desc    Reorder applications
 * @route   PUT /api/applications/reorder
 * @access  Private
 */
const reorderApplications = async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: 'Array of application IDs is required' });
  }

  try {
    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id, userId: req.user.id },
        update: { $set: { orderIndex: index } }
      }
    }));

    await Application.bulkWrite(bulkOps);
    return res.json({ message: 'Applications reordered successfully' });
  } catch (error) {
    console.error('[Application Controller] Reorder error:', error.message);
    return res.status(500).json({ message: 'Server error reordering applications' });
  }
};

module.exports = {
  getApplications,
  createApplication,
  getApplicationById,
  updateApplication,
  deleteApplication,
  reorderApplications,
};
