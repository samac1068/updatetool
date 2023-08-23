import { Build } from "./Build.model";

export class System {
  type!: string;
  path!: string;
  api!: string;
  network!: string;

  servers!: any[];
  databases!: any[];
  updates!: Build[];
}
