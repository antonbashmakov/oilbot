import GoodsItem from "./GoodsItem";
import { Product } from "@/api/models";

const Carousel = ({ products }: { products: Product[] }) => {
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
    </div>
  );
};

export default Carousel;