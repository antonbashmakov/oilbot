import {Car} from "../models";

export const describeCar = (car: Car): string =>
  [car.make, car.model, car.year, car.engine].filter((part) => part !== null && part !== undefined && part !== "").join(" ");

export default (car: Car) => ({
  content: `Здравствуйте! Ваш автомобиль: ${describeCar(car)}. Спросите, какое масло подходит, или опишите другой автомобиль.`,
});
