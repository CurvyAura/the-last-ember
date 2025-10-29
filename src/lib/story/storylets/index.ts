import type { Storylet } from "../types";
import { VIGNETTES } from "./vignettes";
import { ARC_SHELTER } from "./arcShelter";

export const STORYLETS: Storylet[] = [
  ...VIGNETTES,
  ...ARC_SHELTER,
];

export default STORYLETS;
