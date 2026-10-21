import React, { useState } from 'react';
import {
  CartItem,
  PRODUCT_CONSTANTS,
  calculateCartTotals,
} from '../data/productData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onAddSpareCushion: () => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onAddSpareCushion,
  onClearCart,
}) => {
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('SK-2026-8841');
  const totals = calculateCartTotals(cart);

  if (!isOpen) return null;

  const handleCheckout = () => {
    const randomNum = 4100 + Math.floor(Math.random() * 4900);
    setOrderNumber(`SK-2026-${randomNum}`);
    setOrderSubmitted(true);
    onClearCart();
  };

  const handleCloseDrawer = () => {
    setOrderSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* Backdrop click to dismiss */}
      <div className="flex-1" onClick={handleCloseDrawer} />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#0E0E0E] border-l border-[#ECE7DF]/25 flex flex-col justify-between h-full text-[#ECE7DF]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ECE7DF]/15">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#8A8A85] block">
              ROTTERDAM DISPATCH DEPOT
            </span>
            <h2
              id="cart-drawer-title"
              className="font-display text-xl font-bold uppercase tracking-tight text-[#ECE7DF]"
            >
              YOUR REQUISITION [{totals.totalCount}]
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCloseDrawer}
            aria-label="Close cart drawer"
            className="px-3 py-1.5 border border-[#ECE7DF]/20 font-mono text-xs uppercase hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {orderSubmitted ? (
            <div className="border border-[#FF4D00] bg-[#141414] p-6 space-y-4">
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00]">
                REQUISITION CONFIRMED · {orderNumber}
              </div>
              <h3 className="font-display text-2xl font-bold uppercase text-[#ECE7DF]">
                ALLOCATED FOR BENCH TEST IN ROTTERDAM.
              </h3>
              <p className="text-sm text-[#8A8A85] leading-relaxed">
                Your serialized AURA ONE unit and Torx T6 service kit are scheduled for dispatch within 5–7 days from Keilewerf Depot, Rotterdam.
              </p>
              <div className="pt-3 border-t border-[#ECE7DF]/15 font-mono text-xs text-[#ECE7DF] space-y-1">
                <div>WARRANTY: 3 YEARS FULL COVERAGE</div>
                <div>PARTS GUARANTEE: 10 YEARS OEM AVAILABILITY</div>
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="w-full py-3 bg-[#ECE7DF] text-[#0E0E0E] font-mono text-xs uppercase font-semibold tracking-widest hover:bg-[#FF4D00] transition-colors cursor-pointer"
              >
                RETURN TO STUDIO KINETIC
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-12 text-center space-y-4 border border-dashed border-[#ECE7DF]/15 p-6">
              <p className="font-mono text-xs uppercase tracking-widest text-[#8A8A85]">
                REQUISITION LIST IS EMPTY
              </p>
              <p className="text-sm text-[#8A8A85]">
                Select Matte Black, Bone White, or Signal Orange in the configurator to allocate your AURA ONE build.
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className="border border-[#ECE7DF]/15 bg-[#141414] p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-5 h-5 border border-[#ECE7DF]/40 shrink-0"
                          style={{ backgroundColor: item.swatchHex }}
                          aria-hidden="true"
                        />
                        <div>
                          <div className="font-display text-base font-bold uppercase text-[#ECE7DF]">
                            {item.name}
                          </div>
                          <div className="font-mono text-xs text-[#8A8A85]">
                            SKU: {item.sku} · ${item.unitPrice} EA
                          </div>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-semibold text-[#ECE7DF]">
                        ${item.unitPrice * item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ECE7DF]/10">
                      <div className="flex items-center border border-[#ECE7DF]/20">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-8 h-7 font-mono text-xs text-[#ECE7DF] hover:bg-[#ECE7DF]/10 cursor-pointer"
                        >
                          -
                        </button>
                        <span
                          data-testid={`cart-qty-${item.id}`}
                          className="px-3 font-mono text-xs text-[#ECE7DF]"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-8 h-7 font-mono text-xs text-[#ECE7DF] hover:bg-[#ECE7DF]/10 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="font-mono text-xs uppercase text-[#8A8A85] hover:text-[#FF4D00] transition-colors cursor-pointer"
                      >
                        Remove Item
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Modular Spare Part Upsell */}
              <div className="border border-[#ECE7DF]/15 p-4 bg-[#121212] flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] uppercase text-[#FF4D00]">
                    MODULAR SPARE · SK-PRT-02
                  </div>
                  <div className="text-xs font-medium text-[#ECE7DF] mt-0.5">
                    Memory-Foam Lambskin Cushion Pair
                  </div>
                  <div className="font-mono text-xs text-[#8A8A85]">$29 · Magnetic bayonet mount</div>
                </div>
                <button
                  type="button"
                  onClick={onAddSpareCushion}
                  className="px-3 py-2 border border-[#ECE7DF]/25 font-mono text-xs uppercase text-[#ECE7DF] hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  + Add $29
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Subtotal & Checkout */}
        {!orderSubmitted && (
          <div className="p-6 border-t border-[#ECE7DF]/15 bg-[#121212] space-y-4">
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-[#8A8A85]">
                <span>DISPATCH ORIGIN</span>
                <span className="text-[#ECE7DF]">ROTTERDAM, NL (5–7 DAYS)</span>
              </div>
              <div className="flex justify-between text-[#8A8A85]">
                <span>TORX T6 SERVICE KEY + USB-C DAC CABLE</span>
                <span className="text-[#ECE7DF]">INCLUDED ($0)</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-[#ECE7DF] pt-2 border-t border-[#ECE7DF]/15">
                <span>SUBTOTAL</span>
                <span data-testid="cart-subtotal">${totals.subtotal}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className="w-full py-3.5 bg-[#FF4D00] text-[#0E0E0E] font-mono text-xs uppercase font-bold tracking-widest hover:bg-[#ECE7DF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              PROCEED TO DISPATCH — ${totals.subtotal}
            </button>
            <p className="font-mono text-[11px] text-center text-[#8A8A85]">
              {PRODUCT_CONSTANTS.SHIPPING_NOTE} · 30-Day Studio Audition
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
