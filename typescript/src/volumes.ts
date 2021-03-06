import * as ecs from "@aws-cdk/aws-ecs";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as efs from "@aws-cdk/aws-efs";

export const createVolumeManager = (context, vpc) =>
  new VolumeManager(context, vpc);

export class VolumeManager {
  context: any;
  vpc: any;
  volumes: any[] = [];

  get names() {
    return ["config", "databases", "backup", "db"];
  }

  constructor(context, vpc) {
    this.context = context;
    this.vpc = vpc;
  }

  createFs(props: any = {}) {
    const defaultOpts = {
      vpc: this.vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS, // files are not transitioned to infrequent access (IA) storage by default
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE, // default
    };
    return new efs.FileSystem(this.context, props.name, {
      ...defaultOpts,
      ...props,
    });
  }

  createVolume(fileSystem, props: any = {}) {
    const defaultOpts = {
      vpc: this.vpc,
      autoEnableIo: true,
      volumeId: fileSystem.volumeId,
    };
    return new ec2.Volume(this.context, props.name, {
      ...defaultOpts,
      ...props,
    });
  }

  create(name: string, props: any = {}) {
    const fileSystem = this.createFs(props.fs[name]);
    const volume = this.createVolume(fileSystem, props.volume[name]);
    this.addVolume(volume);
    return volume;
  }

  createAll(props) {
    return this.names.map((name) => this.create(name, props));
  }

  addVolume(volume) {
    this.volumes.push(volume);
  }

  addVolumesToTaskDef(taskDef: any, volumes = this.volumes) {
    volumes.map((vol) => taskDef.addVolume(vol));
    return taskDef;
  }
}
