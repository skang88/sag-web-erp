import React, { useRef, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

const CustomKeyboard = ({ value, onChange }) => {
    const keyboard = useRef();

    // This effect ensures the keyboard's internal value is updated if the parent component changes the value prop.
    useEffect(() => {
        keyboard.current.setInput(value);
    }, [value]);

    const handleKeyboardChange = (input) => {
        onChange(input.toUpperCase());
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <Keyboard
                keyboardRef={r => (keyboard.current = r)}
                layoutName={"default"}
                onChange={handleKeyboardChange}
                theme={"hg-theme-default hg-layout-default myTheme"}
                layout={{
                    default: [
                        '1 2 3 4 5 6 7 8 9 0',
                        'Q W E R T Y U I O P',
                        'A S D F G H J K L',
                        'Z X C V B N M {bksp}',
                    ]
                }}
                display={{
                    '{bksp}': 'Backspace',
                }}
            />
        </div>
    );
};

export default CustomKeyboard;