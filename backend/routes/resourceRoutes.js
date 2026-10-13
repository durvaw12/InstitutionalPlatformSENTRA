const express = require('express');
const { listResources, createResource, deleteResource } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectId);
router.use(protect);

router.get('/', listResources);
router.post('/', authorize('administrator'), createResource);
router.delete('/:id', authorize('administrator'), deleteResource);

module.exports = router;
