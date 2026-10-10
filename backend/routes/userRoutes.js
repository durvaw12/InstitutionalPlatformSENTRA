const express = require('express');
const { listUsers, getUser, createUser, updateUser, setUserStatus, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectId);
router.use(protect);

router.get('/', authorize('administrator'), listUsers);
router.post('/', authorize('administrator'), createUser);
router.get('/:id', getUser); // administrator, or the user reading their own record (checked in the controller)
router.patch('/:id/status', authorize('administrator'), setUserStatus);
router.patch('/:id', authorize('administrator'), updateUser);
router.delete('/:id', authorize('administrator'), deleteUser);

module.exports = router;
