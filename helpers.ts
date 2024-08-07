import { GetBaseUoM, GetProductsForIngredient, NutrientBaseUoM } from "./supporting-files/data-access";
import { ConvertUnits, GetCostPerBaseUnit, GetNutrientFactInBaseUnits } from "./supporting-files/helpers";
import { NutrientFact, SupplierProduct, UnitOfMeasure, UoMName, UoMType } from "./supporting-files/models";

export interface LowestCostProduct {
  productName: string;
  nutrientFacts: NutrientFact[];
  supplierProduct: SupplierProduct;
  basePrice: number;
}

// Return lowest cost product data by ingredient from list of products & supplier
export function GetLowestCostByIngredient(ingredientName: string) {
  const products = GetProductsForIngredient({ ingredientName: ingredientName });
  if (!products.length) return undefined;

  let lowestCostProduct: LowestCostProduct;
  let lowestCost: number | undefined;

  for (const product of products) {
    for (const supplier of product.supplierProducts) {
      const costOfProductBySupplier = GetCostPerBaseUnit(supplier);

      if (lowestCost === undefined || costOfProductBySupplier < lowestCost) {
        lowestCost = costOfProductBySupplier;
        lowestCostProduct = {
          productName: product.productName,
          nutrientFacts: product.nutrientFacts,
          supplierProduct: supplier,
          basePrice: costOfProductBySupplier
        };
      }
    }
  }

  return lowestCostProduct!;
}

export function CalcRealCostByBasePrice(realUoM: UnitOfMeasure, basePrice: number) {
  const baseUnitOfMeasure = GetBaseUoM(realUoM.uomType);
  const convertedUoM = ConvertUnits(realUoM, baseUnitOfMeasure.uomName, baseUnitOfMeasure.uomType);
  const cost = basePrice * convertedUoM.uomAmount;

  return cost;
}

// calc nutrient amount from real amount in recipe based on nutrient fact of products
export function CalcRealNutrientsInAnItem(nutrientFacts: NutrientFact[]) {
  const realNutrientFacts: {
    [key: string]: UnitOfMeasure;
  } = {};

  // convert nutrient fact to base unit
  for (const nutrientFact of nutrientFacts) {
    // Convert unit to base unit
    const nutrientFactInBaseUnits = GetNutrientFactInBaseUnits(nutrientFact);

    realNutrientFacts[nutrientFactInBaseUnits.nutrientName] = {
      uomAmount: nutrientFactInBaseUnits.quantityAmount.uomAmount,
      uomName: nutrientFactInBaseUnits.quantityPer.uomName,
      uomType: nutrientFactInBaseUnits.quantityPer.uomType
    };
  }

  return realNutrientFacts;
}

// Use for overriding the ConvertUnits function, add multi time convert (cups => millilitres => grams)
export function ConvertMultiUnits(fromUoM: UnitOfMeasure, toUoMName: UoMName, toUoMType: UoMType) {
  if (fromUoM.uomName === UoMName.cups && toUoMName === UoMName.grams) {
    const convertedToMillilitres = ConvertUnits(fromUoM, UoMName.millilitres, UoMType.volume);
    return ConvertUnits(convertedToMillilitres, toUoMName, toUoMType);
  }

  return ConvertUnits(fromUoM, toUoMName, toUoMType);
}

// Take an nutrient list and total quantity of recipe product. Then return the nutrient fact based on base nutrient data
export function CalcTotalNutrientFacts(nutrients: { [key: string]: UnitOfMeasure }) {
  const nutrientFacts: { [key: string]: NutrientFact } = {};
  for (const nutrientName in nutrients) {
    const nutrient = nutrients[nutrientName];
    nutrientFacts[nutrientName] = {
      nutrientName: nutrientName,
      quantityAmount: {
        uomAmount: nutrient.uomAmount,
        uomName: nutrient.uomName,
        uomType: nutrient.uomType
      },
      quantityPer: {
        uomAmount: NutrientBaseUoM.uomAmount,
        uomName: NutrientBaseUoM.uomName,
        uomType: NutrientBaseUoM.uomType
      }
    };
  }

  return nutrientFacts;
}

// Take object and return another key sorted object
export function sortObjectKeys(object: { [key: string]: any }) {
  const ordered = Object.keys(object)
    .sort()
    .reduce((obj: { [key: string]: any }, key) => {
      obj[key] = object[key];
      return obj;
    }, {});

  return ordered;
}
