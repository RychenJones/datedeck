import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SwipesProvider from '../components/SwipesProvider/SwipesProvider.jsx';
import { useSwipes } from './useSwipes.js';

function renderSwipes() {
  return renderHook(() => useSwipes(), { wrapper: SwipesProvider });
}

function stored() {
  return JSON.parse(window.localStorage.getItem('datedeck.swipes'));
}

describe('useSwipes', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and hides ideas and stores them in datedeck.swipes', () => {
    const { result } = renderSwipes();

    act(() => result.current.save('idea-1'));
    act(() => result.current.hide('idea-2'));

    expect(result.current.saved).toEqual(['idea-1']);
    expect(result.current.hidden).toEqual(['idea-2']);
    expect(stored()).toEqual({ saved: ['idea-1'], hidden: ['idea-2'] });
  });

  it('unsaves and unhides ideas', () => {
    const { result } = renderSwipes();
    act(() => result.current.save('idea-1'));
    act(() => result.current.hide('idea-2'));

    act(() => result.current.unsave('idea-1'));
    act(() => result.current.unhide('idea-2'));

    expect(result.current.saved).toEqual([]);
    expect(result.current.hidden).toEqual([]);
    expect(stored()).toEqual({ saved: [], hidden: [] });
  });

  it('allows an idea to be saved and hidden independently', () => {
    const { result } = renderSwipes();

    act(() => result.current.hide('idea-1'));
    act(() => result.current.save('idea-1'));
    act(() => result.current.save('idea-1'));

    expect(result.current.saved).toEqual(['idea-1']);
    expect(result.current.hidden).toEqual(['idea-1']);
    expect(stored()).toEqual({ saved: ['idea-1'], hidden: ['idea-1'] });
  });

  it('remembers choices from an earlier visit and keeps other stored fields', () => {
    window.localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({ saved: ['idea-1'], hidden: [], version: 1 }),
    );
    const { result } = renderSwipes();

    act(() => result.current.hide('idea-2'));

    expect(result.current.saved).toEqual(['idea-1']);
    expect(stored()).toEqual({ saved: ['idea-1'], hidden: ['idea-2'], version: 1 });
  });

  it('starts empty when the stored value is broken', () => {
    window.localStorage.setItem('datedeck.swipes', 'not json');

    const { result } = renderSwipes();

    expect(result.current.saved).toEqual([]);
    expect(result.current.hidden).toEqual([]);
  });

  it('explains the mistake when used outside SwipesProvider', () => {
    expect(() => renderHook(() => useSwipes())).toThrow(
      'useSwipes must be used inside <SwipesProvider>.',
    );
  });
});
