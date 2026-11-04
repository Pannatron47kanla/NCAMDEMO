/** A part in the cart. `checked` is true until the officer unticks it at hand-over. */
export interface CartPart {
  name: string;
  qty: number;
  price: number;
  checked: boolean;
}

/** One asset waiting to be handed over. */
export interface CartItem {
  assetId: string;
  parts: CartPart[];
}

/** The slice of a registry asset that circulation needs. The registry's `Asset` fits it. */
export interface LendableAsset {
  id: string;
  code: string;
  name: string;
  status: string;
  parts: readonly { name: string; qty: number; price: number }[];
}

export function isInCart(cart: readonly CartItem[], asset: LendableAsset): boolean {
  return cart.some((it) => it.assetId === asset.id);
}

export function cartItemFor(asset: LendableAsset): CartItem {
  return { assetId: asset.id, parts: asset.parts.map((p) => ({ ...p, checked: true })) };
}
