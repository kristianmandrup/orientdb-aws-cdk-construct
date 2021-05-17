import * as ecs from "@aws-cdk/aws-ecs";

export class ImageFactory {
  image: ecs.ContainerImage;
  imageName: string;

  constructor(imageName?: string) {
    this.imageName = imageName || this.defaultImageName;
  }

  get defaultImageName() {
    return "orientdb:3.1.11-tp3";
  }

  create(props) {
    const containerRegistryImageName =
      props.containerRegistryImageName || this.defaultImageName;

    // Default: OrientDb 3.1.11 with Apache Tinkerpop 3
    const registryImage =
      containerRegistryImageName &&
      ecs.ContainerImage.fromRegistry(containerRegistryImageName);

    const ecrImage =
      props.ecrImage && ecs.ContainerImage.fromEcrRepository(props.ecrImage);

    const assetImage =
      props.assetImagePath &&
      ecs.ContainerImage.fromAsset(props.assetImagePath);

    const image = props.image || assetImage || ecrImage || registryImage;
    this.image = image;
    return image;
  }
}
