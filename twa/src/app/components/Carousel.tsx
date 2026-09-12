import GoodsItem from "./GoodsItem";
import { products } from "../data/mock";

const Carousel = () => {
  return (
    <div className="w-full space-y-space-sm pt-1">
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 -mx-layout-margin-mobile px-layout-margin-mobile">
        {products.map((product, index) => (
          <GoodsItem key={product.id} item={product} priority={index === 0} />
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <span className="w-4 h-1 rounded-full bg-primary"></span>
        <span className="w-1.5 h-1 rounded-full bg-surface-variant"></span>
        <span className="w-1.5 h-1 rounded-full bg-surface-variant"></span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
        <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-secondary/30 text-secondary text-label-md hover:bg-secondary/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[15px]">compare_arrows</span>
          <span>Compare Viscosity</span>
        </button>
        <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-secondary/30 text-secondary text-label-md hover:bg-secondary/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[15px]">tune</span>
          <span>Filter by Viscosity 0W-20</span>
        </button>
        <button className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-secondary/30 text-secondary text-label-md hover:bg-secondary/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[15px]">build</span>
          <span>Show Local Mechanics</span>
        </button>
      </div>
    </div>
  );
};

export default Carousel;