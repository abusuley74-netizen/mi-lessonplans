import React from 'react';

const ChemistryKeyboard = ({ onKeyPress, onBackspace, onClear, onEnter }) => {
  const k = (key) => () => onKeyPress?.(key);
  const rows = [
    { keys: [['7'],['8'],['9'],['+','operator'],['-','operator']] },
    { keys: [['4'],['5'],['6'],['×','operator'],['÷','operator']] },
    { keys: [['1'],['2'],['3'],['=','operator'],['(','operator']] },
    { keys: [['0'],['.'],[')',  'operator'],['→','operator'],['⇌','operator']] },
    { keys: [['→','chem-symbol'],['⇌','chem-symbol'],['↑','chem-symbol'],['↓','chem-symbol'],['∆','chem-symbol']] },
    { keys: [['°C','chem-symbol'],['°F','chem-symbol'],['(s)','chem-symbol'],['(l)','chem-symbol'],['(g)','chem-symbol']] },
    { keys: [['(aq)','chem-symbol'],['H⁺','chem-symbol'],['OH⁻','chem-symbol'],['H₃O⁺','chem-symbol'],['Na⁺','chem-symbol']] },
    { keys: [['K⁺','chem-symbol'],['Ca²⁺','chem-symbol'],['Mg²⁺','chem-symbol'],['Al³⁺','chem-symbol'],['Fe²⁺','chem-symbol']] },
    { keys: [['Fe³⁺','chem-symbol'],['Cu²⁺','chem-symbol'],['Zn²⁺','chem-symbol'],['Ag⁺','chem-symbol'],['Cl⁻','chem-symbol']] },
    { keys: [['Br⁻','chem-symbol'],['I⁻','chem-symbol'],['SO₄²⁻','chem-symbol'],['NO₃⁻','chem-symbol'],['CO₃²⁻','chem-symbol']] },
    { keys: [['PO₄³⁻','chem-symbol'],['pH','chem-symbol'],['pOH','chem-symbol'],['pK_a','chem-symbol'],['K_c','chem-symbol']] },
    { keys: [['K_p','chem-symbol'],['K_w','chem-symbol'],['K_a','chem-symbol'],['K_b','chem-symbol'],['α','chem-symbol']] },
    { keys: [['β','chem-symbol'],['γ','chem-symbol'],['ΔH','chem-symbol'],['ΔG','chem-symbol'],['ΔS','chem-symbol']] },
  ];

  return (
    <div className="chemistry-keyboard" data-testid="chemistry-keyboard">
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
        <button className="keyboard-key action" onClick={k(' ')}>Space</button>
        <button className="keyboard-key action" onClick={onEnter}>Enter</button>
        <button className="keyboard-key chem-symbol" onClick={k('E°')}>E°</button>
      </div>
    </div>
  );
};

export default ChemistryKeyboard;
