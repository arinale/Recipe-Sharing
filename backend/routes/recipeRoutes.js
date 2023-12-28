const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const recipeFilePath = path.join(__dirname, "recipe.json");

const appId = process.env.APP_ID;
const appKey = process.env.APP_KEY;
const router = express.Router();

const findRecipeByLabel = (label, recipes) => {
  return recipes.find((recipe) => recipe.label === label);
};

router.get("/recipes/:ingredient", async (req, res) => {
  const ingredient = req.params.ingredient;
  try {
    const response = await axios.get(
      `https://api.edamam.com/search?q=${ingredient}&app_id=${appId}&app_key=${appKey}`
    );
    const recipes = response.data.hits.map((hit) => ({
      label: hit.recipe.label,
      image: hit.recipe.image,
      uri: hit.recipe.url,
      ingredients: hit.recipe.ingredients,
    }));

    console.log(recipes);

    //save recipes
    const allRecipes = fs.existsSync(recipeFilePath)
      ? JSON.parse(fs.readFileSync(recipeFilePath, "utf8"))
      : [];
    const recipeToSend = recipes.map((incomingRecipe) => {
      const existingRecipe = findRecipeByLabel(
        incomingRecipe.label,
        allRecipes
      );
      if (existingRecipe) {
        incomingRecipe.reviews = existingRecipe.reviews;
      } else {
        incomingRecipe.reviews = [];
        allRecipes.push(incomingRecipe);
      }
      return incomingRecipe;
    });
    // Save the merged list back to the JSON file.
    fs.writeFileSync(
      recipeFilePath,
      JSON.stringify(allRecipes, null, 2),
      "utf8"
    );
    console.log(response);
    res.status(200).json(recipeToSend);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.post("/recipes/reviews/:label", (req, res) => {
  const label = req.params.label;
  const { review } = req.body;
  //Check if recipes file exists, create if not
  if (!fs.existsSync(recipeFilePath)) {
    fs.writeFileSync(recipeFilePath, "[]", "utf8");
  }

  const recipes = JSON.parse(fs.readFileSync(recipeFilePath, "utf8"));

  const recipe = recipes.find((recipe) => recipe.label === label);
  if (recipe) {
    recipe.reviews = recipe.reviews || [];
    recipe.reviews.push(review);

    // Save the updated recipes list back to the JSON file.
    fs.writeFileSync(recipeFilePath, JSON.stringify(recipes, null, 2), "utf8");

    // Send the updated reviews as the response.
    console.log(recipe.reviews);

    res.json(recipe.reviews);
  } else {
    res.status(404).json({ error: "Recipe not found" });
  }
});

module.exports = router;
