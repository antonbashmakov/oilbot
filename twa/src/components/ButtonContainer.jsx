import './ButtonContainer.css';

import Header from '../components/Header';

export default function ButtonContainer({ text , children}) {
  return (
    <div className='container'>
      <Header />
        {children}
      <div className='bottomButton'>
        <button
          className="button"
        >
          {text}
        </button>
      </div>
    </div>
  );
}