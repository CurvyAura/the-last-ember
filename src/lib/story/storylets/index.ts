import type { Storylet } from "../types";
import { VIGNETTES } from "./vignettes";
import { ARC_SHELTER } from "./arcShelter";
import { INTERACTIVE } from "./interactive";

export const STORYLETS: Storylet[] = [
  ...VIGNETTES,
  ...ARC_SHELTER,
  ...INTERACTIVE,
];

export default STORYLETS;
