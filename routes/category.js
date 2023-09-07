const express = require('express');
const Category = require('../models/category');

const categoryRouter = express.Router();

// Create a new category
categoryRouter.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name });

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all categories
categoryRouter.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ message: 'Categories retrieved successfully', categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a category by ID
categoryRouter.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.query;
    const { name } = req.body;

    const category = await Category.findByIdAndUpdate(id, { name }, { new: true });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a category by ID
categoryRouter.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.query;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = categoryRouter;
