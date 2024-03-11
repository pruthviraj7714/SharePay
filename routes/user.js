const express = require("express");
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");

const router = express.Router();

const signUpSchema = zod.object({
  username: zod.string().email(),
  password: zod.string().min(6),
  firstName: zod.string(),
  lastName: zod.string(),
});

const signInSchema = zod.object({
  username: zod.string().email(),
  password: zod.string().min(6),
});

router.post("/signup", async (req, res) => {
  try {
    const payload = signUpSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ msg: "Invalid Inputs" });
    }

    const existingUser = await User.findOne({
      username: payload.data.username,
    });
    if (existingUser) {
      return res.status(411).json({ msg: "User already exists!" });
    }

    const newUser = await User.create({
      username: req.body.username,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    const userId = newUser._id;

    await Account.create({
      userId,
      balance: Math.floor(Math.random() * 10000) + 1,
    });

    const token = jwt.sign({ userId }, JWT_SECRET);

    return res.status(200).json({ msg: "User created successfully", token });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const payLoad = signInSchema.safeParse(req.body);

    if (!payLoad.success) {
      return res.status(411).json({
        msg: "Invalid Inputs",
      });
    }

    const user = await User.findOne({
      username: payLoad.data.username,
      password: payLoad.data.password,
    });

    if (user) {
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);

      return res.status(200).json({
        msg: "Logged in succesfullyl",
        token,
      });
    } else {
      res.status(411).json({
        msg: "User Not found!",
      });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

const updateBody = zod.object({
  password: zod.string().min(6).optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

router.put("/", authMiddleware, async (req, res) => {
  const payLoad = updateBody.safeParse(req.body);

  if (!payLoad.success) {
    return res.status(411).json({
      msg: "Invalid Inputs",
    });
  }

  await User.updateOne(
    {
      _id: req.userId,
    },
    req.body
  );

  res.json({
    msg: "Updated successfully",
  });
});

router.get("/info", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const account = await Account.findOne({ userId: req.userId });

    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      balance: account.balance
    });
  } catch (e) {
    console.error("Error while getting user info:", e);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  const id  = req.userId;

  try {
    await User.deleteOne({
      _id : id
    })

    res.json({
      msg : "User Deleted Succesfully!"
    })
    

  } catch (e) {
    res.status(500).json({
      msg : "Internal Server error"
    })
  }

})



router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;
