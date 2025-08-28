import React, { useState, useRef } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

const ManualVisitorRegistrationModal = ({ isOpen, onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [purpose, setPurpose] = useState('');
    const [duration, setDuration] = useState(0);
    const [licensePlate, setLicensePlate] = useState('');
    const keyboard = useRef();

    const handlePurposeSelect = (selectedPurpose) => {
        setPurpose(selectedPurpose);
        setStep(2);
    };

    const handleDurationSelect = (selectedDuration) => {
        setDuration(selectedDuration);
        setStep(3);
    };

    const handleLicensePlateSubmit = () => {
        onSubmit({
            purpose,
            duration,
            licensePlate,
        });
        resetState();
    };

    const resetState = () => {
        setStep(1);
        setPurpose('');
        setDuration(0);
        setLicensePlate('');
        if (keyboard.current) {
            keyboard.current.clearInput();
        }
    }

    const handleClose = () => {
        resetState();
        onClose();
    }

    const onKeyboardChange = (input) => {
        setLicensePlate(input.toUpperCase());
    }

    const onKeyPress = (button) => {
        if (button === "{enter}") {
            handleLicensePlateSubmit();
        }
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h3 className="text-xl font-bold mb-4">1. Select Purpose of Visit</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handlePurposeSelect('Delivery')} className="p-4 bg-blue-500 text-white rounded-lg">Delivery</button>
                            <button onClick={() => handlePurposeSelect('Meeting')} className="p-4 bg-blue-500 text-white rounded-lg">Meeting</button>
                            <button onClick={() => handlePurposeSelect('Parcel Delivery')} className="p-4 bg-blue-500 text-white rounded-lg">Parcel Delivery</button>
                            <button onClick={() => handlePurposeSelect('Others')} className="p-4 bg-blue-500 text-white rounded-lg">Others</button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h3 className="text-xl font-bold mb-4">2. Select Duration</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <button onClick={() => handleDurationSelect(1)} className="p-4 bg-green-500 text-white rounded-lg">1 Day</button>
                            <button onClick={() => handleDurationSelect(7)} className="p-4 bg-green-500 text-white rounded-lg">7 Days</button>
                            <button onClick={() => handleDurationSelect(30)} className="p-4 bg-green-500 text-white rounded-lg">1 Month</button>
                        </div>
                        <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-600">Back</button>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h3 className="text-xl font-bold mb-4">3. Enter License Plate</h3>
                        <input
                            type="text"
                            value={licensePlate}
                            readOnly
                            placeholder="Enter License Plate"
                            className="p-4 border rounded w-full text-2xl text-center mb-4"
                        />
                        <Keyboard
                            keyboardRef={r => (keyboard.current = r)}
                            layoutName={"default"}
                            onChange={onKeyboardChange}
                            onKeyPress={onKeyPress}
                            theme={"hg-theme-default hg-layout-default myTheme"}
                            layout={{
                                default: [
                                    '1 2 3 4 5 6 7 8 9 0',
                                    'Q W E R T Y U I O P',
                                    'A S D F G H J K L',
                                    'Z X C V B N M {bksp}',
                                    '{space} {enter}'
                                ]
                            }}
                            display={{
                                '{bksp}': 'backspace',
                                '{enter}': 'enter',
                                '{space}': 'space'
                            }}
                        />
                        <div className="mt-4 flex justify-between">
                            <button onClick={() => setStep(2)} className="text-sm text-gray-600">Back</button>
                            <button onClick={handleLicensePlateSubmit} className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Submit & Open Gate</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Manual Visitor Registration</h2>
                    <button onClick={handleClose} className="text-2xl font-bold">&times;</button>
                </div>
                {renderStep()}
            </div>
        </div>
    );
};

export default ManualVisitorRegistrationModal;