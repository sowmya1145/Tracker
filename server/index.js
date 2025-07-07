const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/transactionDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const transactionSchema = new mongoose.Schema({
  type: String,
  amount: Number,
  category: String,
  date: Date,
  notes: String,
});
const Transaction = mongoose.model("Transaction", transactionSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const budgetSchema = new mongoose.Schema({
  category: String,
  amount: Number,
  month: String,
});
const Budget = mongoose.model("Budget", budgetSchema);

app.get("/api/transactions", async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });
  res.send(transactions);
});

app.post("/api/transactions", async (req, res) => {
  const { type, amount, category, date } = req.body;

  try {
    const newTransaction = new Transaction(req.body);
    await newTransaction.save();

    if (type === "Expense") {
      const transactionMonth = date.slice(0, 7);
      const budget = await Budget.findOne({ category, month: transactionMonth });

      if (budget) {
        const expenses = await Transaction.find({
          type: "Expense",
          category,
          date: {
            $gte: new Date(`${transactionMonth}-01`),
            $lt: new Date(`${transactionMonth}-31T23:59:59.999Z`),
          },
        });

        const totalSpent = expenses.reduce((sum, txn) => sum + txn.amount, 0);

        if (totalSpent > budget.amount) {
          return res.status(201).send({
            message: "Transaction added",
            warning: `Warning: Budget for '${category}' exceeded by ₹${(totalSpent - budget.amount).toFixed(2)}`,
          });
        }
      }
    }

    res.status(201).send({ message: "Transaction added" });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).send({ error: "Failed to add transaction" });
  }
});

app.put("/api/transactions/:id", async (req, res) => {
  await Transaction.findByIdAndUpdate(req.params.id, req.body);
  res.send({ message: "Transaction updated" });
});

app.delete("/api/transactions/:id", async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.send({ message: "Transaction deleted" });
});

app.get("/api/budgets/:month", async (req, res) => {
  const { month } = req.params;
  const budgets = await Budget.find({ month });
  res.send(budgets);
});

app.post("/api/budgets", async (req, res) => {
  const newBudget = new Budget(req.body);
  await newBudget.save();
  res.status(201).send({ message: "Budget saved" });
});

app.put("/api/budgets/:id", async (req, res) => {
  await Budget.findByIdAndUpdate(req.params.id, req.body);
  res.send({ message: "Budget updated" });
});

app.delete("/api/budgets/:id", async (req, res) => {
  await Budget.findByIdAndDelete(req.params.id);
  res.send({ message: "Budget deleted" });
});

app.get("/api/summary", async (req, res) => {
  const transactions = await Transaction.find();
  const totalIncome = transactions.filter(t => t.type === "Income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "Expense").reduce((sum, t) => sum + t.amount, 0);
  res.send({ totalIncome, totalExpense, balance: totalIncome - totalExpense });
});

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send({ error: "Username already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).send({ error: "Error registering user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send({ error: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send({ error: "Invalid password" });
    const token = jwt.sign({ userId: user._id }, "secret_key", { expiresIn: "1h" });
    res.status(200).send({ message: "Login successful", token });
  } catch (error) {
    res.status(500).send({ error: "Error logging in" });
  }
});



app.listen(5000, () => console.log("Server running on http://localhost:5000"));
