"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Vector3, Box3 } from "three";

type LevelDefinition = {
  id: number;
  name: string;
  start: Vector3;
  startRotation: number;
  goalPosition: Vector3;
  goalRotation: number;
  goalSize: Vector3;
  obstacles: { position: Vector3; size: Vector3; height?: number }[];
  bounds: { width: number; height: number };
};

type KeyboardState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
};

const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: "Training Grounds",
    start: new Vector3(-12, 0, 14),
    startRotation: Math.PI,
    goalPosition: new Vector3(12, 0, -10),
    goalRotation: 0,
    goalSize: new Vector3(6, 0, 12),
    obstacles: [
      { position: new Vector3(0, 0, 0), size: new Vector3(4, 2, 16) },
      { position: new Vector3(8, 0, 8), size: new Vector3(4, 2, 4) },
      { position: new Vector3(-8, 0, -6), size: new Vector3(4, 2, 6) }
    ],
    bounds: { width: 40, height: 30 }
  },
  {
    id: 2,
    name: "Downtown Alley",
    start: new Vector3(-16, 0, 12),
    startRotation: Math.PI / 2,
    goalPosition: new Vector3(16, 0, -12),
    goalRotation: -Math.PI / 2,
    goalSize: new Vector3(5, 0, 10),
    obstacles: [
      { position: new Vector3(-6, 0, 6), size: new Vector3(3, 3, 6) },
      { position: new Vector3(2, 0, 0), size: new Vector3(3, 3, 14) },
      { position: new Vector3(10, 0, -8), size: new Vector3(3, 3, 6) },
      { position: new Vector3(0, 0, -12), size: new Vector3(20, 3, 2) }
    ],
    bounds: { width: 48, height: 36 }
  },
  {
    id: 3,
    name: "Rooftop Pursuit",
    start: new Vector3(18, 0, 14),
    startRotation: Math.PI,
    goalPosition: new Vector3(-18, 0, -14),
    goalRotation: -Math.PI,
    goalSize: new Vector3(5.5, 0, 11),
    obstacles: [
      { position: new Vector3(0, 0, 0), size: new Vector3(6, 5, 6) },
      { position: new Vector3(-10, 0, -6), size: new Vector3(4, 4, 10) },
      { position: new Vector3(10, 0, 6), size: new Vector3(5, 4, 8) },
      { position: new Vector3(-5, 0, 12), size: new Vector3(3, 4, 4) },
      { position: new Vector3(12, 0, -10), size: new Vector3(5, 4, 5) }
    ],
    bounds: { width: 52, height: 40 }
  }
];

const CAMERA_POSITION = new Vector3(18, 28, 28);
const CAMERA_TARGET = new Vector3(0, 0, 0);

function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false
  });

  useEffect(() => {
    const onKey = (pressed: boolean) => (event: KeyboardEvent) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          setState(prev => ({ ...prev, forward: pressed }));
          break;
        case "ArrowDown":
        case "KeyS":
          setState(prev => ({ ...prev, backward: pressed }));
          break;
        case "ArrowLeft":
        case "KeyA":
          setState(prev => ({ ...prev, left: pressed }));
          break;
        case "ArrowRight":
        case "KeyD":
          setState(prev => ({ ...prev, right: pressed }));
          break;
        case "Space":
          setState(prev => ({ ...prev, brake: pressed }));
          break;
        default:
          break;
      }
    };

    const down = onKey(true);
    const up = onKey(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return state;
}

function Car({
  carRef
}: {
  carRef: React.MutableRefObject<Group | null>;
}) {
  return (
    <group ref={carRef} position={[0, 0.4, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.6, 3]} />
        <meshStandardMaterial color="#1f6efa" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, -0.1]}>
        <boxGeometry args={[1.4, 0.5, 1.6]} />
        <meshStandardMaterial color="#0d2d8c" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.85, -0.7]}>
        <boxGeometry args={[1.2, 0.3, 0.6]} />
        <meshStandardMaterial color="#0a1c55" />
      </mesh>
      <mesh position={[0, 0.7, -1.3]}>
        <boxGeometry args={[1.3, 0.2, 0.5]} />
        <meshStandardMaterial color="#ffffff" emissive="#2b6cff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.7, 1.25]}>
        <boxGeometry args={[1.3, 0.2, 0.5]} />
        <meshStandardMaterial color="#ff2d2d" emissive="#872020" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.7, 0.4, -0.4]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.8, 0.2, 0.2]} />
        <meshStandardMaterial color="#1f1f1f" />
      </mesh>
      <mesh position={[-0.7, 0.4, -0.4]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.8, 0.2, 0.2]} />
        <meshStandardMaterial color="#1f1f1f" />
      </mesh>
      <mesh position={[0.7, 0.4, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.8, 0.2, 0.2]} />
        <meshStandardMaterial color="#1f1f1f" />
      </mesh>
      <mesh position={[-0.7, 0.4, 0.9]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.8, 0.2, 0.2]} />
        <meshStandardMaterial color="#1f1f1f" />
      </mesh>
      <mesh position={[0, 0.9, 0.4]}>
        <boxGeometry args={[0.7, 0.15, 0.5]} />
        <meshStandardMaterial color="#f4f7ff" emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function ParkingLot({
  level,
  goalPulse
}: {
  level: LevelDefinition;
  goalPulse: number;
}) {
  const { width, height } = level.bounds;

  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 4, height + 4]} />
        <meshStandardMaterial color="#0f1016" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#1b1d2d" />
      </mesh>
      <group>
        <mesh position={[0, 1.6, -height / 2]}>
          <boxGeometry args={[width, 3.2, 0.4]} />
          <meshStandardMaterial color="#13141f" />
        </mesh>
        <mesh position={[0, 1.6, height / 2]}>
          <boxGeometry args={[width, 3.2, 0.4]} />
          <meshStandardMaterial color="#13141f" />
        </mesh>
        <mesh position={[-width / 2, 1.6, 0]}>
          <boxGeometry args={[0.4, 3.2, height]} />
          <meshStandardMaterial color="#13141f" />
        </mesh>
        <mesh position={[width / 2, 1.6, 0]}>
          <boxGeometry args={[0.4, 3.2, height]} />
          <meshStandardMaterial color="#13141f" />
        </mesh>
      </group>
      {level.obstacles.map((obstacle, index) => (
        <mesh key={index} position={[obstacle.position.x, (obstacle.height ?? 2) / 2, obstacle.position.z]} castShadow receiveShadow>
          <boxGeometry args={[obstacle.size.x, obstacle.height ?? 2, obstacle.size.z]} />
          <meshStandardMaterial color="#2c2e42" roughness={0.8} />
        </mesh>
      ))}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[level.goalPosition.x, 0.02, level.goalPosition.z]}
      >
        <planeGeometry args={[level.goalSize.x, level.goalSize.z]} />
        <meshStandardMaterial
          color="#144b1c"
          emissive="#1cd742"
          emissiveIntensity={0.15 + 0.15 * Math.sin(goalPulse * 4)}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[level.goalPosition.x, 0.03, level.goalPosition.z]}
      >
        <ringGeometry
          args={[
            Math.min(level.goalSize.x, level.goalSize.z) * 0.45,
            Math.min(level.goalSize.x, level.goalSize.z) * 0.5,
            32
          ]}
        />
        <meshStandardMaterial color="#1cd742" transparent opacity={0.35 + 0.25 * Math.sin(goalPulse * 6)} />
      </mesh>
    </group>
  );
}

function Lighting() {
  return (
    <>
      <hemisphereLight intensity={0.35} groundColor="#0a0b12" />
      <directionalLight
        position={[14, 28, 12]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        position={[-18, 20, 18]}
        angle={0.4}
        intensity={0.8}
        color="#1b5cff"
        penumbra={0.6}
        castShadow
      />
      <Environment preset="city" />
    </>
  );
}

function computeBoundingBox(center: Vector3, size: Vector3): Box3 {
  const halfSize = size.clone().multiplyScalar(0.5);
  return new Box3(center.clone().sub(halfSize), center.clone().add(halfSize));
}

const carSize = new Vector3(1.6, 1.2, 3);

function GameLoop({
  level,
  onSuccess,
  onCrash,
  keyboard,
  resetSignal
}: {
  level: LevelDefinition;
  onSuccess: (elapsed: number, bumps: number) => void;
  onCrash: () => void;
  keyboard: KeyboardState;
  resetSignal: number;
}) {
  const carRef = useRef<Group | null>(null);
  const velocity = useRef(0);
  const [goalPulse, setGoalPulse] = useState(0);
  const timeRef = useRef(0);
  const bumpsRef = useRef(0);

  const boundsBox = useMemo(() => {
    const { width, height } = level.bounds;
    return computeBoundingBox(new Vector3(0, 0, 0), new Vector3(width - 1, 5, height - 1));
  }, [level.bounds]);

  const obstacleBoxes = useMemo(
    () =>
      level.obstacles.map(obstacle =>
        computeBoundingBox(
          new Vector3(obstacle.position.x, (obstacle.height ?? 2) / 2, obstacle.position.z),
          new Vector3(
            Math.max(obstacle.size.x - 0.4, 0.5),
            obstacle.height ?? 2,
            Math.max(obstacle.size.z - 0.4, 0.5)
          )
        )
      ),
    [level.obstacles]
  );

  const goalBox = useMemo(() => {
    return computeBoundingBox(
      new Vector3(level.goalPosition.x, 0.6, level.goalPosition.z),
      new Vector3(level.goalSize.x - 0.4, 1.2, level.goalSize.z - 0.4)
    );
  }, [level.goalPosition, level.goalSize]);

  const resetCarState = useCallback(() => {
    velocity.current = 0;
    timeRef.current = 0;
    bumpsRef.current = 0;
    setGoalPulse(0);

    if (carRef.current) {
      carRef.current.position.copy(level.start);
      carRef.current.position.y = 0.4;
      carRef.current.rotation.y = level.startRotation;
    }
  }, [level.start, level.startRotation]);

  useEffect(() => {
    resetCarState();
  }, [level, resetSignal, resetCarState]);

  useFrame((state, delta) => {
    setGoalPulse(prev => prev + delta);
    timeRef.current += delta;

    const car = carRef.current;
    if (!car) return;

    const accel = keyboard.forward ? 22 : keyboard.backward ? -16 : 0;
    const brakeForce = keyboard.brake ? 35 : 0;
    const maxSpeed = keyboard.backward ? 10 : 24;
    const friction = keyboard.forward || keyboard.backward || keyboard.brake ? 5 : 8;

    velocity.current += accel * delta;
    if (keyboard.brake) {
      if (Math.abs(velocity.current) < brakeForce * delta) {
        velocity.current = 0;
      } else {
        velocity.current -= Math.sign(velocity.current) * brakeForce * delta;
      }
    }

    velocity.current = Math.max(Math.min(velocity.current, maxSpeed), -10);

    if (!keyboard.forward && !keyboard.backward) {
      const damping = Math.min(Math.abs(velocity.current), friction * delta);
      velocity.current -= Math.sign(velocity.current) * damping;
    }

    const steerInput = (keyboard.left ? 1 : 0) - (keyboard.right ? 1 : 0);
    const steerIntensity = Math.min(Math.abs(velocity.current) / 10, 1);
    const steerSpeed = 1.7;
    const turnAmount = steerInput * steerSpeed * steerIntensity * delta;
    car.rotation.y += turnAmount;
    const forwardMove = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), car.rotation.y);
    const lastPosition = car.position.clone();
    car.position.addScaledVector(forwardMove, velocity.current * delta);

    if (!boundsBox.containsPoint(car.position.clone().setY(1))) {
      car.position.copy(lastPosition);
      velocity.current *= -0.3;
      bumpsRef.current += 1;
    }

    const carBox = computeBoundingBox(
      car.position.clone().setY(0.6),
      new Vector3(carSize.x, carSize.y, carSize.z * 0.7)
    );

    const collided = obstacleBoxes.some(box => box.intersectsBox(carBox));
    if (collided) {
      car.position.copy(lastPosition);
      velocity.current *= -0.4;
      bumpsRef.current += 1;
    }

    const inGoal = goalBox.containsPoint(car.position.clone().setY(0.6));
    const facingRequirement = Math.abs(
      Math.atan2(Math.sin(car.rotation.y - level.goalRotation), Math.cos(car.rotation.y - level.goalRotation))
    );
    if (inGoal && Math.abs(velocity.current) < 1.2 && facingRequirement < 0.3) {
      onSuccess(timeRef.current, bumpsRef.current);
      velocity.current = 0;
    }

    if (Math.abs(velocity.current) > 35) {
      onCrash();
      resetCarState();
    }
  });

  return (
    <>
      <ParkingLot level={level} goalPulse={goalPulse} />
      <Car carRef={carRef} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#020205" />
      </mesh>
    </>
  );
}

type GameState =
  | { status: "intro" }
  | { status: "playing"; levelIndex: number; startedAt: number }
  | { status: "success"; levelIndex: number; elapsed: number; bumps: number }
  | { status: "complete"; totalTime: number; totalBumps: number };

export function PoliceParkingGame() {
  const [gameState, setGameState] = useState<GameState>({ status: "intro" });
  const [resetSignal, setResetSignal] = useState(0);
  const keyboard = useKeyboard();
  const [totalTime, setTotalTime] = useState(0);
  const [totalBumps, setTotalBumps] = useState(0);

  const currentLevel = useMemo(() => {
    const levelIndex = gameState.status === "playing" || gameState.status === "success"
      ? gameState.levelIndex
      : 0;
    return LEVELS[levelIndex];
  }, [gameState]);

  const startLevel = useCallback((levelIndex: number) => {
    setGameState({ status: "playing", levelIndex, startedAt: performance.now() });
    setResetSignal(prev => prev + 1);
  }, []);

  const handleSuccess = useCallback(
    (elapsedSeconds: number, bumps: number) => {
      if (gameState.status !== "playing") {
        return;
      }
      const nextTotalTime = totalTime + elapsedSeconds;
      const nextTotalBumps = totalBumps + bumps;
      setTotalTime(nextTotalTime);
      setTotalBumps(nextTotalBumps);
      if (gameState.levelIndex === LEVELS.length - 1) {
        setGameState({
          status: "complete",
          totalTime: nextTotalTime,
          totalBumps: nextTotalBumps
        });
      } else {
        setGameState({
          status: "success",
          levelIndex: gameState.levelIndex,
          elapsed: elapsedSeconds,
          bumps
        });
      }
    },
    [gameState, totalBumps, totalTime]
  );

  const handleCrash = useCallback(() => {
    setTotalBumps(prev => prev + 1);
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        if (gameState.status === "intro") {
          startLevel(0);
        } else if (gameState.status === "success") {
          startLevel(gameState.levelIndex + 1);
        } else if (gameState.status === "complete") {
          setGameState({ status: "intro" });
          setTotalBumps(0);
          setTotalTime(0);
        }
      }
      if (event.code === "KeyR" && gameState.status === "playing") {
        setResetSignal(prev => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, startLevel]);

  return (
    <div className="game-shell">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z], fov: 60 }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z]} />
          <OrbitControls target={[CAMERA_TARGET.x, CAMERA_TARGET.y, CAMERA_TARGET.z]} enablePan={false} maxPolarAngle={Math.PI / 2.2} minDistance={18} maxDistance={48} />
          <Lighting />
          <GameLoop
            level={currentLevel}
            onSuccess={handleSuccess}
            onCrash={handleCrash}
            keyboard={keyboard}
            resetSignal={resetSignal}
          />
        </Suspense>
      </Canvas>
      <div className="hud">
        <div className="hud__panel">
          <h1>Police Parking 3D</h1>
          <p className="hud__subtitle">{currentLevel.name}</p>
          <div className="hud__stats">
            <span>Level: {gameState.status === "playing" || gameState.status === "success" ? gameState.levelIndex + 1 : 1}/{LEVELS.length}</span>
            <span>Crashes: {totalBumps}</span>
            <span>Time: {totalTime.toFixed(1)}s</span>
          </div>
          <div className="hud__controls">
            <p><strong>Controls</strong></p>
            <p>Steer: Arrow Keys / WASD</p>
            <p>Brake: Space</p>
            <p>Restart Level: R</p>
            <p>Next/Start: Enter</p>
          </div>
        </div>
        <div className="hud__status">
          {gameState.status === "intro" && (
            <div className="hud__banner">
              <h2>Roll Call, Officer</h2>
              <p>Back your cruiser into the marked bay without scraping the patrol yard.</p>
              <button onClick={() => startLevel(0)}>Start Patrol</button>
            </div>
          )}
          {gameState.status === "success" && (
            <div className="hud__banner success">
              <h2>Level Cleared</h2>
              <p>Response time: {gameState.elapsed.toFixed(1)}s · Bumps: {gameState.bumps}</p>
              <button onClick={() => startLevel(gameState.levelIndex + 1)}>Next Assignment</button>
            </div>
          )}
          {gameState.status === "complete" && (
            <div className="hud__banner victory">
              <h2>All Precincts Secure</h2>
              <p>Total Time: {gameState.totalTime.toFixed(1)}s · Bumps: {gameState.totalBumps}</p>
              <button onClick={() => setGameState({ status: "intro" })}>Run It Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
