const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/incidentController');
const { addResponse, listResponses } = require('../controllers/responseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadIncidentFiles } = require('../middleware/uploadMiddleware');
const { validateObjectId, validateReferenceId } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectId);
router.param('referenceId', validateReferenceId);
router.use(protect);

// Reference IDs are sequential, so throttle lookups to make enumeration impractical.
const referenceLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many lookups. Wait a minute and try again.' },
});

router.post('/', authorize('student', 'staff'), uploadIncidentFiles, ctrl.createIncident);
router.get('/', authorize('administrator'), ctrl.listIncidents);

// Fixed paths must be declared before "/:id"
router.get('/my', ctrl.getMyIncidents);
router.get('/assigned', authorize('staff', 'administrator'), ctrl.getAssignedIncidents);
router.get('/reference/:referenceId', referenceLimiter, ctrl.getIncidentByReference);

router.get('/:id', ctrl.getIncidentById);
router.patch('/:id/status', ctrl.updateStatus); // administrator or assigned staff (checked in the controller)
router.patch('/:id/assignment', authorize('administrator'), ctrl.updateAssignment);
router.patch('/:id/details', authorize('administrator'), ctrl.updateDetails);
router.delete('/:id', authorize('administrator'), ctrl.deleteIncident);

router.get('/:id/responses', listResponses);
router.post('/:id/responses', addResponse); // administrator or assigned staff (checked in the controller)

module.exports = router;
