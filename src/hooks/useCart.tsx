import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart') /*--ALTERAÇÃO FEITA: a variável storagedCart recupera 
    os dados do carrinho por meio do método getItem*/

    if (storagedCart) { /*--ALTERAÇÃO FEITA: apenas foi descomentado, mas essa condicional é ativada quando a recuperação dos 
      dados do carrinho vier como string. Se não for, ele pula a condicional e vai direto pro return final*/
       return JSON.parse(storagedCart); /*--ALTERAÇÃO FEITA: --ALTERAÇÃO FEITA: apenas foi descomentado, mas esse método 
       transforma o que foi recebido como string de volta em array*/
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
       const cartAtt = [...cart]; /*--ALTERAÇÃO FEITA: clona a informação atual do carrinho para a variável*/
       const productAvailable = cartAtt.find(product => product.id === productId); /*--ALTERAÇÃO FEITA: verifica a existência 
       do produto no estoque*/
       const stock = await api.get(`/stock/${productId}`); /*--ALTERAÇÃO FEITA: espera*/
       const stockAmount = stock.data.amount;
       const currentAmount = productAvailable ? productAvailable.amount : 0;
       const amount = currentAmount + 1;

       if (amount > stockAmount){
          toast.error('Quantidade solicitada fora de estoque');
          return;
       }

       if(productAvailable){
         productAvailable.amount = amount;
       } else {
         const product = await api.get(`/products/${productId}`);
         const newProduct = {
           ...product.data,
           amount: 1
         }
         cartAtt.push(newProduct);
       }

       setCart(cartAtt);
       localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAtt))
    } catch {
      toast.error('Erro na adição do produto'); /*--ALTERAÇÃO FEITA: mensagem de erro feita pelo toast*/
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartAtt = [...cart]
      const productIndex = cartAtt.findIndex(product => product.id === productId);

      if(productIndex >= 0){
        cartAtt.splice(productIndex, 1);
        setCart(cartAtt);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAtt))
      } else{
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto'); /*--ALTERAÇÃO FEITA: mensagem de erro feita pelo toast*/
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try { /**/
       if(amount <= 0){
        return;
       }
       
       const stock = await  api.get(`/stock/${productId}`);
       
       const stockAmount = stock.data.amount;
       
       if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
       }
       const cartAtt = [...cart];
       const productAvailable = cartAtt.find(product => product.id === productId);

       if(productAvailable){
        productAvailable.amount = amount;
        setCart(cartAtt);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAtt))
      } else {
          throw Error();
       }
    } catch {
      toast.error('Erro na alteração de quantidade do produto'); /*--ALTERAÇÃO FEITA: mensagem de erro feita pelo toast*/
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
