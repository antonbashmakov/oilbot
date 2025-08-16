import './ButtonContainer.css'

export default function ButtonContainer({ text , children}) {
  return (
    <div className='container'>
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