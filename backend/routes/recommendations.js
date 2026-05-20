const express = require("express");
const router = express.Router();
const { protect, premiumOnly } = require("../middleware/auth");
const { getAll, getExercises, getDiet } = require("../controllers/recommendationController");

router.use(protect);
router.get("/",          getAll);          // basic — free users get limited results
router.get("/exercises", premiumOnly, getExercises); // premium only
router.get("/diet",      premiumOnly, getDiet);      // premium only

module.exports = router;
