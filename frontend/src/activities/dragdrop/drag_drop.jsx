import React, { useEffect } from "react";
import Phaser from "phaser";

const PhaserDragDrop = () => {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: "phaser-container",
      scene: {
        preload,
        create,
      },
    };

    const game = new Phaser.Game(config);

    function preload() {
      this.load.image("box", "https://labs.phaser.io/assets/sprites/block.png");
      this.load.image("target", "https://labs.phaser.io/assets/sprites/target.png");
    }

    function create() {
      const target = this.add.image(400, 300, "target");
      const box = this.add.image(100, 100, "box").setInteractive();

      this.input.setDraggable(box);

      this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
      });

      this.input.on("drop", (pointer, gameObject, dropZone) => {
        console.log("Dropped!");
      });
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="phaser-container" className="w-full h-full"></div>;
};

export default PhaserDragDrop;
