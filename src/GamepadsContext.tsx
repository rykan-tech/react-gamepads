import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface GamepadsProviderProps {
  children: React.ReactNode;
}

interface GamepadsState {
  [key: number]: {
    buttons: readonly GamepadButton[];
    id: string;
    axes: readonly number[];
  };
}

interface GamepadsContext {
  gamepads: GamepadsState;
  setGamepads: React.Dispatch<React.SetStateAction<GamepadsState>>;
}

const GamepadsContext = createContext({});

const GamepadsProvider = ({ children }: GamepadsProviderProps) => {
  const [gamepads, setGamepads] = useState<GamepadsState>({});
  const requestRef = useRef<number>();

  let haveEvents = 'ongamepadconnected' in window;

  const addGamepad = useCallback(
    (gamepad: Gamepad) => {
      setGamepads({
        ...gamepads,
        [gamepad.index]: {
          buttons: gamepad.buttons,
          id: gamepad.id,
          axes: gamepad.axes,
        },
      });

      // Handle controller input before render
      // requestAnimationFrame(updateStatus);
    },
    [gamepads, setGamepads]
  );

  /**
   * Adds game controllers during connection event listener
   * @param {object} e
   */
  const connectGamepadHandler = (e: Event) => {
    addGamepad((e as GamepadEvent).gamepad);
  };

  /**
   * Finds all gamepads and adds them to context
   */
  const scanGamepads = useCallback(() => {
    // Grab gamepads from browser API
    let detectedGamepads = navigator.getGamepads
      ? navigator.getGamepads()
      : navigator.webkitGetGamepads
      ? navigator.webkitGetGamepads()
      : [];

    // Loop through all detected controllers and add if not already in state
    for (let i = 0; i < detectedGamepads.length; i++) {
      if (detectedGamepads[i] !== null) {
        addGamepad(detectedGamepads[i] as Gamepad);
      }
    }
  }, [addGamepad]);

  // Add event listener for gamepad connecting
  useEffect(() => {
    window.addEventListener('gamepadconnected', connectGamepadHandler);

    return window.removeEventListener(
      'gamepadconnected',
      connectGamepadHandler
    );
  });

  // Update each gamepad's status on each "tick"
  const animate = useCallback(() => {
    if (!haveEvents) scanGamepads();
    requestRef.current = requestAnimationFrame(animate);
  }, [requestRef, scanGamepads, haveEvents]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [animate]);

  return (
    <GamepadsContext.Provider value={{ gamepads, setGamepads }}>
      {children}
    </GamepadsContext.Provider>
  );
};

export { GamepadsProvider, GamepadsContext };
