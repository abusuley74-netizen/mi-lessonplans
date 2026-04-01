import React from 'react';

const PhysicsKeyboard = ({ onKeyPress, onBackspace, onClear, onEnter }) => {
  const k = (key) => () => onKeyPress?.(key);
  const rows = [
    { keys: [['7'],['8'],['9'],['+','operator'],['-','operator']] },
    { keys: [['4'],['5'],['6'],['×','operator'],['÷','operator']] },
    { keys: [['1'],['2'],['3'],['=','operator'],['(','operator']] },
    { keys: [['0'],['.'],')',['→','operator'],['↔','operator']] },
    { keys: [['α','physics-symbol'],['β','physics-symbol'],['γ','physics-symbol'],['δ','physics-symbol'],['ε','physics-symbol']] },
    { keys: [['θ','physics-symbol'],['φ','physics-symbol'],['ω','physics-symbol'],['Ω','physics-symbol'],['μ','physics-symbol']] },
    { keys: [['ρ','physics-symbol'],['σ','physics-symbol'],['τ','physics-symbol'],['λ','physics-symbol'],['ν','physics-symbol']] },
    { keys: [['π','physics-symbol'],['Σ','physics-symbol'],['Δ','physics-symbol'],['∇','physics-symbol'],['∂','physics-symbol']] },
    { keys: [['∫','physics-symbol'],['∑','physics-symbol'],['∏','physics-symbol'],['∞','physics-symbol'],['∠','physics-symbol']] },
    { keys: [['°','physics-symbol'],['′','physics-symbol'],['″','physics-symbol'],['∥','physics-symbol'],['⊥','physics-symbol']] },
    { keys: [['→','physics-symbol'],['↔','physics-symbol'],['↑','physics-symbol'],['↓','physics-symbol'],['⇌','physics-symbol']] },
    { keys: [['F','physics-symbol'],['m','physics-symbol'],['a','physics-symbol'],['v','physics-symbol'],['u','physics-symbol']] },
    { keys: [['t','physics-symbol'],['s','physics-symbol'],['g','physics-symbol'],['p','physics-symbol'],['P','physics-symbol']] },
    { keys: [['V','physics-symbol'],['T','physics-symbol'],['Q','physics-symbol'],['c','physics-symbol'],['f','physics-symbol']] },
    { keys: [['I','physics-symbol'],['R','physics-symbol'],['C','physics-symbol'],['L','physics-symbol'],['h','physics-symbol']] },
    { keys: [['ε₀','physics-symbol'],['μ₀','physics-symbol'],['k','physics-symbol'],['G','physics-symbol'],['ℏ','physics-symbol']] },
    { keys: [['∇','physics-symbol'],['×','physics-symbol'],['·','physics-symbol'],['⊗','physics-symbol'],['⊕','physics-symbol']] },
    { keys: [['°C','physics-symbol'],['°F','physics-symbol'],['°K','physics-symbol'],['Å','physics-symbol'],['eV','physics-symbol']] },
    { keys: [['keV','physics-symbol'],['MeV','physics-symbol'],['GeV','physics-symbol']] },
  ];

  return (
    <div className="physics-keyboard" data-testid="physics-keyboard">
      {rows.map((row, i) => (
        <div className="keyboard-row" key={i}>
          {row.keys.map((item, j) => {
            const [label, cls] = Array.isArray(item) ? item : [item, ''];
            return <button key={j} className={`keyboard-key ${cls}`} onClick={k(label)}>{label}</button>;
          })}
        </div>
      ))}
      <div className="keyboard-row">
        <button className="keyboard-key action" onClick={onClear}>Clear</button>
        <button className="keyboard-key action" onClick={onBackspace}>&#9003;</button>
      </div>
      <div className="keyboard-row">
        <button className="keyboard-key action" onClick={k(' ')}>Space</button>
        <button className="keyboard-key action" onClick={onEnter}>Enter</button>
      </div>
    </div>
  );
};

export default PhysicsKeyboard;
