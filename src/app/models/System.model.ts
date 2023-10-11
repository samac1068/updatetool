import { Build } from "./Build.model";

export class System {
  type!: string;
  path!: string;
  webcontrol!: string;
  sapi!: string;
  network!: string;

  servers!: any[];
  databases!: any[];
  updates!: Build[];

  apiGet!: boolean;
  apiPost!: boolean;
  apiDB!: boolean;
}
