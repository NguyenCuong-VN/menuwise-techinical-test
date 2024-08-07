import {
  CalcRealCostByBasePrice,
  CalcRealNutrientsInAnItem,
  CalcTotalNutrientFacts,
  ConvertMultiUnits,
  GetLowestCostByIngredient,
  LowestCostProduct,
  sortObjectKeys
} from "./helpers";
import { GetRecipes, NutrientBaseUoM } from "./supporting-files/data-access";
import { SumUnitsOfMeasure } from "./supporting-files/helpers";
import { Recipe, UnitOfMeasure } from "./supporting-files/models";
import { ExpectedRecipeSummary, RunTest } from "./supporting-files/testing";

console.clear();
console.log("Expected Result Is:", ExpectedRecipeSummary);

const recipeData = GetRecipes(); // the list of 1 recipe you should calculate the information for
console.log("Recipe Data:", recipeData);
const recipeSummary: any = {}; // the final result to pass into the test function
/*
 * YOUR CODE GOES BELOW THIS, DO NOT MODIFY ABOVE
 * (You can add more imports if needed)
 * */

// set result to use for case when multi recipe calculation, not diff for single recipe calculation
// NOTE: this memorize should use in this case, when product data won't be changed
// NOTICE: this pricing based on base UoM
const baseIngredientPricing: { [key: string]: LowestCostProduct } = {};

const calcAnRecipeSummary = (recipe: Recipe) => {
  let totalCost = 0;
  let totalQtyOfRecipe: UnitOfMeasure = {
    uomAmount: 0,
    uomName: NutrientBaseUoM.uomName,
    uomType: NutrientBaseUoM.uomType
  };
  const nutrients: { [key: string]: UnitOfMeasure } = {}; // total nutrients used in this recipe

  for (const lineItem of recipe.lineItems) {
    // ----------find the best price supplier for each lineItem----------
    let lowestCostProduct: LowestCostProduct | undefined = baseIngredientPricing[lineItem.ingredient.ingredientName];

    // if not found prev, find the lowest price from suppliers
    if (!lowestCostProduct) {
      lowestCostProduct = GetLowestCostByIngredient(lineItem.ingredient.ingredientName); // this func return pricing based on base UoM, cause multi recipe has multi unit diff
      if (!lowestCostProduct) throw new Error(`Could not find supplier for lineItem`);
      // set result to use for case when multi recipe calculation, not diff for single recipe calculation
      baseIngredientPricing[lineItem.ingredient.ingredientName] = lowestCostProduct;
    }

    // ----------calc cost of line item----------
    totalCost += CalcRealCostByBasePrice(lineItem.unitOfMeasure, lowestCostProduct.basePrice);

    // ----------calc nutrients of line item----------
    const realNutrients = CalcRealNutrientsInAnItem(lowestCostProduct.nutrientFacts);

    // ----------sum nutrients & sum qty----------
    for (const nutrientName in realNutrients) {
      if (!nutrients[nutrientName]) nutrients[nutrientName] = realNutrients[nutrientName];
      else nutrients[nutrientName].uomAmount += realNutrients[nutrientName].uomAmount;
    }
    const convertedItem = ConvertMultiUnits(lineItem.unitOfMeasure, totalQtyOfRecipe.uomName, totalQtyOfRecipe.uomType);

    totalQtyOfRecipe = SumUnitsOfMeasure(totalQtyOfRecipe, convertedItem);
  }

  // calc total nutrients
  const nutrientFacts = CalcTotalNutrientFacts(nutrients);

  // summarize
  const recipeDetail = {
    cheapestCost: totalCost,
    nutrientsAtCheapestCost: sortObjectKeys(nutrientFacts)
  };

  return recipeDetail;
};

// main here
for (const recipe of recipeData) {
  const recipeDetail = calcAnRecipeSummary(recipe);
  recipeSummary[recipe.recipeName] = recipeDetail;
}

/*
 * YOUR CODE ABOVE THIS, DO NOT MODIFY BELOW
 * */
RunTest(recipeSummary);