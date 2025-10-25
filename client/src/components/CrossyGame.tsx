import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CrossyGameProps {
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
}

export function CrossyGame({ onGameOver, onScoreChange }: CrossyGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameStateRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Game constants
    const zoom = 2;
    const chickenSize = 15;
    const positionWidth = 42;
    const columns = 17;
    const boardWidth = positionWidth * columns;
    const stepTime = 200;

    const laneTypes = ["car", "truck", "forest"];
    const laneSpeeds = [2, 2.5, 3];
    const vehicleColors = [0xa52523, 0xbdb638, 0x78b14b];
    const treeHeights = [20, 45, 60];

    // Scene setup
    const scene = new THREE.Scene();
    const distance = 500;
    
    const camera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      0.1,
      10000
    );

    camera.rotation.x = (50 * Math.PI) / 180;
    camera.rotation.y = (20 * Math.PI) / 180;
    camera.rotation.z = (10 * Math.PI) / 180;

    const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
    const initialCameraPositionX =
      Math.tan(camera.rotation.y) *
      Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
    camera.position.y = initialCameraPositionY;
    camera.position.x = initialCameraPositionX;
    camera.position.z = distance;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Textures
    function createTexture(width: number, height: number, rects: any[]) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "rgba(0,0,0,0.6)";
      rects.forEach((rect) => {
        context.fillRect(rect.x, rect.y, rect.w, rect.h);
      });
      return new THREE.CanvasTexture(canvas);
    }

    const carFrontTexture = createTexture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
    const carBackTexture = createTexture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
    const carRightSideTexture = createTexture(110, 40, [
      { x: 10, y: 0, w: 50, h: 30 },
      { x: 70, y: 0, w: 30, h: 30 },
    ]);
    const carLeftSideTexture = createTexture(110, 40, [
      { x: 10, y: 10, w: 50, h: 30 },
      { x: 70, y: 10, w: 30, h: 30 },
    ]);

    const truckFrontTexture = createTexture(30, 30, [{ x: 15, y: 0, w: 10, h: 30 }]);
    const truckRightSideTexture = createTexture(25, 30, [{ x: 0, y: 15, w: 10, h: 10 }]);
    const truckLeftSideTexture = createTexture(25, 30, [{ x: 0, y: 5, w: 10, h: 10 }]);

    // Game objects
    function Wheel() {
      const wheel = new THREE.Mesh(
        new THREE.BoxGeometry(12 * zoom, 33 * zoom, 12 * zoom),
        new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
      );
      wheel.position.z = 6 * zoom;
      return wheel;
    }

    function Car() {
      const car = new THREE.Group();
      const color = vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

      const main = new THREE.Mesh(
        new THREE.BoxGeometry(60 * zoom, 30 * zoom, 15 * zoom),
        new THREE.MeshPhongMaterial({ color, flatShading: true })
      );
      main.position.z = 12 * zoom;
      main.castShadow = true;
      main.receiveShadow = true;
      car.add(main);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(33 * zoom, 24 * zoom, 12 * zoom),
        [
          new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carBackTexture }),
          new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carFrontTexture }),
          new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carRightSideTexture }),
          new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carLeftSideTexture }),
          new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }),
          new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }),
        ]
      );
      cabin.position.x = 6 * zoom;
      cabin.position.z = 25.5 * zoom;
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      car.add(cabin);

      const frontWheel = Wheel();
      frontWheel.position.x = -18 * zoom;
      car.add(frontWheel);

      const backWheel = Wheel();
      backWheel.position.x = 18 * zoom;
      car.add(backWheel);

      car.castShadow = true;
      car.receiveShadow = false;

      return car;
    }

    function Truck() {
      const truck = new THREE.Group();
      const color = vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(100 * zoom, 25 * zoom, 5 * zoom),
        new THREE.MeshLambertMaterial({ color: 0xb4c6fc, flatShading: true })
      );
      base.position.z = 10 * zoom;
      truck.add(base);

      const cargo = new THREE.Mesh(
        new THREE.BoxGeometry(75 * zoom, 35 * zoom, 40 * zoom),
        new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true })
      );
      cargo.position.x = 15 * zoom;
      cargo.position.z = 30 * zoom;
      cargo.castShadow = true;
      cargo.receiveShadow = true;
      truck.add(cargo);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(25 * zoom, 30 * zoom, 30 * zoom),
        [
          new THREE.MeshPhongMaterial({ color, flatShading: true }),
          new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckFrontTexture }),
          new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckRightSideTexture }),
          new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckLeftSideTexture }),
          new THREE.MeshPhongMaterial({ color, flatShading: true }),
          new THREE.MeshPhongMaterial({ color, flatShading: true }),
        ]
      );
      cabin.position.x = -40 * zoom;
      cabin.position.z = 20 * zoom;
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      truck.add(cabin);

      const frontWheel = Wheel();
      frontWheel.position.x = -38 * zoom;
      truck.add(frontWheel);

      const middleWheel = Wheel();
      middleWheel.position.x = -10 * zoom;
      truck.add(middleWheel);

      const backWheel = Wheel();
      backWheel.position.x = 30 * zoom;
      truck.add(backWheel);

      return truck;
    }

    function Tree() {
      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(15 * zoom, 15 * zoom, 20 * zoom),
        new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true })
      );
      trunk.position.z = 10 * zoom;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      const height = treeHeights[Math.floor(Math.random() * treeHeights.length)];

      const crown = new THREE.Mesh(
        new THREE.BoxGeometry(30 * zoom, 30 * zoom, height * zoom),
        new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true })
      );
      crown.position.z = (height / 2 + 20) * zoom;
      crown.castShadow = true;
      crown.receiveShadow = false;
      tree.add(crown);

      return tree;
    }

    function Chicken() {
      const chicken = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(chickenSize * zoom, chickenSize * zoom, 20 * zoom),
        new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true })
      );
      body.position.z = 10 * zoom;
      body.castShadow = true;
      body.receiveShadow = true;
      chicken.add(body);

      const rowel = new THREE.Mesh(
        new THREE.BoxGeometry(2 * zoom, 4 * zoom, 2 * zoom),
        new THREE.MeshLambertMaterial({ color: 0xf0619a, flatShading: true })
      );
      rowel.position.z = 21 * zoom;
      rowel.castShadow = true;
      rowel.receiveShadow = false;
      chicken.add(rowel);

      return chicken;
    }

    function Road() {
      const road = new THREE.Group();

      const createSection = (color: number) =>
        new THREE.Mesh(
          new THREE.PlaneGeometry(boardWidth * zoom, positionWidth * zoom),
          new THREE.MeshPhongMaterial({ color })
        );

      const middle = createSection(0x454a59);
      middle.receiveShadow = true;
      road.add(middle);

      const left = createSection(0x393d49);
      left.position.x = -boardWidth * zoom;
      road.add(left);

      const right = createSection(0x393d49);
      right.position.x = boardWidth * zoom;
      road.add(right);

      return road;
    }

    function Grass() {
      const grass = new THREE.Group();

      const createSection = (color: number) =>
        new THREE.Mesh(
          new THREE.BoxGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom),
          new THREE.MeshPhongMaterial({ color })
        );

      const middle = createSection(0xbaf455);
      middle.receiveShadow = true;
      grass.add(middle);

      const left = createSection(0x99c846);
      left.position.x = -boardWidth * zoom;
      grass.add(left);

      const right = createSection(0x99c846);
      right.position.x = boardWidth * zoom;
      grass.add(right);

      grass.position.z = 1.5 * zoom;
      return grass;
    }

    function Lane(index: number) {
      const lane: any = { index };
      lane.type = index <= 0 ? "field" : laneTypes[Math.floor(Math.random() * laneTypes.length)];

      switch (lane.type) {
        case "field":
          lane.mesh = Grass();
          break;
        case "forest":
          lane.mesh = Grass();
          lane.occupiedPositions = new Set();
          lane.trees = [1, 2, 3, 4].map(() => {
            const tree = Tree();
            let position;
            do {
              position = Math.floor(Math.random() * columns);
            } while (lane.occupiedPositions.has(position));
            lane.occupiedPositions.add(position);
            tree.position.x =
              (position * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
            lane.mesh.add(tree);
            return tree;
          });
          break;
        case "car":
        case "truck":
          lane.mesh = Road();
          lane.direction = Math.random() >= 0.5;
          const vehicleCount = lane.type === "car" ? 3 : 2;
          const divider = lane.type === "car" ? 2 : 3;
          const occupiedPositions = new Set();
          lane.vehicles = Array(vehicleCount)
            .fill(0)
            .map(() => {
              const vehicle = lane.type === "car" ? Car() : Truck();
              let position;
              do {
                position = Math.floor((Math.random() * columns) / divider);
              } while (occupiedPositions.has(position));
              occupiedPositions.add(position);
              vehicle.position.x =
                (position * positionWidth * divider + positionWidth / 2) * zoom -
                (boardWidth * zoom) / 2;
              if (!lane.direction) vehicle.rotation.z = Math.PI;
              lane.mesh.add(vehicle);
              return vehicle;
            });
          lane.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
          break;
      }

      return lane;
    }

    // Initialize game state
    const chicken = Chicken();
    scene.add(chicken);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    scene.add(hemiLight);

    const initialDirLightPositionX = -100;
    const initialDirLightPositionY = -100;
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
    dirLight.castShadow = true;
    dirLight.target = chicken;
    scene.add(dirLight);

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    const d = 500;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    const backLight = new THREE.DirectionalLight(0x000000, 0.4);
    backLight.position.set(200, 200, 50);
    backLight.castShadow = true;
    scene.add(backLight);

    // Game state
    let lanes: any[] = [];
    let currentLane = 0;
    let currentColumn = Math.floor(columns / 2);
    let previousTimestamp: number | null = null;
    let startMoving = false;
    let moves: string[] = [];
    let stepStartTimestamp: number | null = null;
    let gameOver = false;

    const generateLanes = () =>
      [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((index) => {
          const lane = Lane(index);
          lane.mesh.position.y = index * positionWidth * zoom;
          scene.add(lane.mesh);
          return lane;
        })
        .filter((lane) => lane.index >= 0);

    const addLane = () => {
      const index = lanes.length;
      const lane = Lane(index);
      lane.mesh.position.y = index * positionWidth * zoom;
      scene.add(lane.mesh);
      lanes.push(lane);
    };

    const initializeValues = () => {
      lanes.forEach((lane) => scene.remove(lane.mesh));
      lanes = generateLanes();
      currentLane = 0;
      currentColumn = Math.floor(columns / 2);
      previousTimestamp = null;
      startMoving = false;
      moves = [];
      stepStartTimestamp = null;
      gameOver = false;

      chicken.position.x = 0;
      chicken.position.y = 0;
      camera.position.y = initialCameraPositionY;
      camera.position.x = initialCameraPositionX;
      dirLight.position.x = initialDirLightPositionX;
      dirLight.position.y = initialDirLightPositionY;
    };

    initializeValues();

    const move = (direction: string) => {
      if (gameOver) return;

      const finalPositions = moves.reduce(
        (position, mv) => {
          if (mv === "forward") return { lane: position.lane + 1, column: position.column };
          if (mv === "backward") return { lane: position.lane - 1, column: position.column };
          if (mv === "left") return { lane: position.lane, column: position.column - 1 };
          if (mv === "right") return { lane: position.lane, column: position.column + 1 };
          return position;
        },
        { lane: currentLane, column: currentColumn }
      );

      if (direction === "forward") {
        if (
          lanes[finalPositions.lane + 1].type === "forest" &&
          lanes[finalPositions.lane + 1].occupiedPositions.has(finalPositions.column)
        )
          return;
        if (!stepStartTimestamp) startMoving = true;
        addLane();
      } else if (direction === "backward") {
        if (finalPositions.lane === 0) return;
        if (
          lanes[finalPositions.lane - 1].type === "forest" &&
          lanes[finalPositions.lane - 1].occupiedPositions.has(finalPositions.column)
        )
          return;
        if (!stepStartTimestamp) startMoving = true;
      } else if (direction === "left") {
        if (finalPositions.column === 0) return;
        if (
          lanes[finalPositions.lane].type === "forest" &&
          lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column - 1)
        )
          return;
        if (!stepStartTimestamp) startMoving = true;
      } else if (direction === "right") {
        if (finalPositions.column === columns - 1) return;
        if (
          lanes[finalPositions.lane].type === "forest" &&
          lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column + 1)
        )
          return;
        if (!stepStartTimestamp) startMoving = true;
      }
      moves.push(direction);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w") move("forward");
      else if (event.key === "ArrowDown" || event.key === "s") move("backward");
      else if (event.key === "ArrowLeft" || event.key === "a") move("left");
      else if (event.key === "ArrowRight" || event.key === "d") move("right");
    };

    window.addEventListener("keydown", handleKeyDown);

    // Animation loop
    function animate(timestamp: number) {
      if (!gameOver) {
        requestAnimationFrame(animate);
      }

      if (!previousTimestamp) previousTimestamp = timestamp;
      const delta = timestamp - previousTimestamp;
      previousTimestamp = timestamp;

      lanes.forEach((lane) => {
        if (lane.type === "car" || lane.type === "truck") {
          const aBitBeforeTheBeginingOfLane = (-boardWidth * zoom) / 2 - positionWidth * 2 * zoom;
          const aBitAfterTheEndOFLane = (boardWidth * zoom) / 2 + positionWidth * 2 * zoom;
          lane.vehicles.forEach((vehicle: any) => {
            if (lane.direction) {
              vehicle.position.x =
                vehicle.position.x < aBitBeforeTheBeginingOfLane
                  ? aBitAfterTheEndOFLane
                  : (vehicle.position.x -= (lane.speed / 16) * delta);
            } else {
              vehicle.position.x =
                vehicle.position.x > aBitAfterTheEndOFLane
                  ? aBitBeforeTheBeginingOfLane
                  : (vehicle.position.x += (lane.speed / 16) * delta);
            }
          });
        }
      });

      if (startMoving) {
        stepStartTimestamp = timestamp;
        startMoving = false;
      }

      if (stepStartTimestamp) {
        const moveDeltaTime = timestamp - stepStartTimestamp;
        const moveDeltaDistance = Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
        const jumpDeltaDistance =
          Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;

        switch (moves[0]) {
          case "forward": {
            const positionY = currentLane * positionWidth * zoom + moveDeltaDistance;
            camera.position.y = initialCameraPositionY + positionY;
            dirLight.position.y = initialDirLightPositionY + positionY;
            chicken.position.y = positionY;
            chicken.position.z = jumpDeltaDistance;
            break;
          }
          case "backward": {
            const positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
            camera.position.y = initialCameraPositionY + positionY;
            dirLight.position.y = initialDirLightPositionY + positionY;
            chicken.position.y = positionY;
            chicken.position.z = jumpDeltaDistance;
            break;
          }
          case "left": {
            const positionX =
              (currentColumn * positionWidth + positionWidth / 2) * zoom -
              (boardWidth * zoom) / 2 -
              moveDeltaDistance;
            camera.position.x = initialCameraPositionX + positionX;
            dirLight.position.x = initialDirLightPositionX + positionX;
            chicken.position.x = positionX;
            chicken.position.z = jumpDeltaDistance;
            break;
          }
          case "right": {
            const positionX =
              (currentColumn * positionWidth + positionWidth / 2) * zoom -
              (boardWidth * zoom) / 2 +
              moveDeltaDistance;
            camera.position.x = initialCameraPositionX + positionX;
            dirLight.position.x = initialDirLightPositionX + positionX;
            chicken.position.x = positionX;
            chicken.position.z = jumpDeltaDistance;
            break;
          }
        }

        if (moveDeltaTime > stepTime) {
          switch (moves[0]) {
            case "forward":
              currentLane++;
              onScoreChange(currentLane);
              break;
            case "backward":
              currentLane--;
              onScoreChange(currentLane);
              break;
            case "left":
              currentColumn--;
              break;
            case "right":
              currentColumn++;
              break;
          }
          moves.shift();
          stepStartTimestamp = moves.length === 0 ? null : timestamp;
        }
      }

      // Hit test
      if (lanes[currentLane]?.type === "car" || lanes[currentLane]?.type === "truck") {
        const chickenMinX = chicken.position.x - (chickenSize * zoom) / 2;
        const chickenMaxX = chicken.position.x + (chickenSize * zoom) / 2;
        const vehicleLength = { car: 60, truck: 105 }[lanes[currentLane].type];
        lanes[currentLane].vehicles.forEach((vehicle: any) => {
          const carMinX = vehicle.position.x - (vehicleLength * zoom) / 2;
          const carMaxX = vehicle.position.x + (vehicleLength * zoom) / 2;
          if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
            gameOver = true;
            onGameOver(currentLane);
          }
        });
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    // Store game state for external control
    gameStateRef.current = { move, initializeValues };

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onGameOver, onScoreChange]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
