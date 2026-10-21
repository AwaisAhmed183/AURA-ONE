import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCT_CONSTANTS,
  FINISHES,
  FINISH_LIST,
  ASSEMBLY_PARTS,
  TECHNICAL_SPECS,
  REVIEWS,
  computeAssemblyStateAtScroll,
  computeSingleStagePose,
  computeSectionDriven3DJourney,
  addItemToCart,
  addSpareCushionToCart,
  updateCartItemQuantity,
  removeCartItem,
  calculateCartTotals,
} from './productData.ts';

test('product constants and finishes maintain strict consistency ($349, 254g, 40h)', () => {
  assert.equal(PRODUCT_CONSTANTS.BASE_PRICE, 349);
  assert.equal(PRODUCT_CONSTANTS.WEIGHT_GRAMS, 254);
  assert.equal(PRODUCT_CONSTANTS.BATTERY_HOURS, 40);
  assert.equal(FINISH_LIST.length, 3);

  for (const finish of FINISH_LIST) {
    assert.equal(finish.price, 349);
  }

  const totalPartsWeight = ASSEMBLY_PARTS.reduce((acc, part) => acc + part.weightGrams, 0);
  assert.equal(totalPartsWeight, 254, 'Sum of 7 modular sub-assemblies equals 254g');
  assert.equal(ASSEMBLY_PARTS.length, 7, 'Must have exactly 7 exploded parts');
  assert.equal(TECHNICAL_SPECS.length, 8);
  assert.equal(REVIEWS.length, 3);
});

test('scroll assembly explosion and piece-by-piece reassembly state machine', () => {
  // At scroll start (0.0), all parts are assembled
  for (let i = 0; i < 7; i++) {
    const startState = computeAssemblyStateAtScroll(0, i);
    assert.equal(startState.partExplosionFactor, 0);
    assert.equal(startState.phaseLabel, 'ASSEMBLED');
  }

  // At scroll 0.22, all parts are exploded (factor = 1)
  for (let i = 0; i < 7; i++) {
    const peakState = computeAssemblyStateAtScroll(0.22, i);
    assert.ok(peakState.partExplosionFactor > 0.99, `Part ${i} should be exploded at 0.22`);
  }

  // Midway through reassembly (e.g. 0.55), earlier parts have reassembled while later parts remain exploded
  const midPart0 = computeAssemblyStateAtScroll(0.55, 0);
  const midPart6 = computeAssemblyStateAtScroll(0.55, 6);
  assert.equal(midPart0.partExplosionFactor, 0, 'Part 0 should already be reassembled at 0.55');
  assert.equal(midPart6.partExplosionFactor, 1, 'Part 6 should still be exploded at 0.55');

  // At scroll end (1.0), all 7 parts are completely reassembled
  for (let i = 0; i < 7; i++) {
    const endState = computeAssemblyStateAtScroll(1.0, i);
    assert.equal(endState.partExplosionFactor, 0, `Part ${i} must be reassembled at scroll 1.0`);
    assert.equal(endState.phaseLabel, 'REASSEMBLED');
  }
});

test('section-driven 3D journey stages enforce safe scales, non-clipping camera, and bay offsets', () => {
  const hero = computeSectionDriven3DJourney(0, 0.2, 0, 0, false);
  assert.equal(hero.stage, 'HERO');
  assert.ok(hero.posX > 0.4, 'Hero headphone sits on the right stage bay on desktop');
  assert.ok(hero.scale <= 0.52, 'Hero headphone scaled down for safe framing');

  const assembly = computeSectionDriven3DJourney(1, 0.35, 1, 0, false);
  assert.equal(assembly.stage, 'ASSEMBLY');
  assert.ok(assembly.scale <= 0.44, 'Exploded assembly uses compact scale to fit all 7 parts with margin');
  assert.ok(assembly.assemblyLocalProgress > 0.3 && assembly.assemblyLocalProgress < 0.6);

  const sound = computeSectionDriven3DJourney(2, 0.5, 2, 0, false);
  assert.equal(sound.stage, 'SOUND_DRIVER');
  assert.ok(sound.camZ >= 4.2, 'Camera stays outside the ear cup in Sound section (no clipping)');
  assert.ok(sound.driverExposeFactor > 0.2 && sound.driverExposeFactor <= 0.38, 'Controlled driver cutaway');
  assert.ok(sound.driverPulseIntensity > 0.6, 'Driver pulse intensity active during Sound section');

  const specs = computeSectionDriven3DJourney(3, 0.5, 3, 0, false);
  assert.equal(specs.stage, 'SPECS_PROFILE');
  assert.ok(specs.posX < -0.5, 'Specs side profile sits inside the left telemetry bay');
  assert.ok(specs.rotY > 1.2 && specs.rotY < 2.2, 'Headphone is in side profile during Specs');

  const gallery = computeSectionDriven3DJourney(4, 0.5, 4, 0, false);
  assert.equal(gallery.stage, 'GALLERY_OFFSET');
  assert.ok(gallery.scale <= 0.46, 'Headphone pulls back smaller during Gallery');
  assert.ok(gallery.posX > 0.5, 'Headphone offsets right during Gallery');

  const reviews = computeSectionDriven3DJourney(5, 0.5, 5, 0, false);
  assert.equal(reviews.stage, 'REVIEWS_CLEAR');
  assert.ok(reviews.posX > 0.7, 'Headphone stays clear of review cards on the right bay');

  const buyStart = computeSingleStagePose(6, 0.0, false);
  const buyEnd = computeSingleStagePose(6, 1.0, false);
  assert.equal(buyEnd.stage, 'BUY_FINALE');
  assert.equal(buyEnd.finaleContrastBoost, 1, 'Buy finale activates key/rim contrast lighting boost');
  assert.ok(
    buyEnd.rotY - buyStart.rotY > Math.PI * 1.9,
    'Headphone completes a full 360 rotation in Buy section'
  );
});

test('cart state transitions: add finish, increment, add spare cushion, remove', () => {
  let cart = addItemToCart([], FINISHES['matte-black'], 1);
  assert.equal(cart.length, 1);
  assert.equal(calculateCartTotals(cart).totalCount, 1);
  assert.equal(calculateCartTotals(cart).subtotal, 349);

  // Adding same finish increments quantity
  cart = addItemToCart(cart, FINISHES['matte-black'], 1);
  assert.equal(cart.length, 1);
  assert.equal(calculateCartTotals(cart).totalCount, 2);
  assert.equal(calculateCartTotals(cart).subtotal, 698);

  // Adding Signal Orange finish creates second line item
  cart = addItemToCart(cart, FINISHES['signal-orange'], 1);
  assert.equal(cart.length, 2);
  assert.equal(calculateCartTotals(cart).totalCount, 3);
  assert.equal(calculateCartTotals(cart).subtotal, 1047);

  // Adding spare lambskin cushion ($29)
  cart = addSpareCushionToCart(cart);
  assert.equal(calculateCartTotals(cart).totalCount, 4);
  assert.equal(calculateCartTotals(cart).subtotal, 1076);

  // Decrementing Matte Black quantity
  cart = updateCartItemQuantity(cart, 'matte-black', -1);
  assert.equal(calculateCartTotals(cart).totalCount, 3);
  assert.equal(calculateCartTotals(cart).subtotal, 727);

  // Removing Signal Orange item
  cart = removeCartItem(cart, 'signal-orange');
  assert.equal(calculateCartTotals(cart).totalCount, 2);
  assert.equal(calculateCartTotals(cart).subtotal, 378);
});

