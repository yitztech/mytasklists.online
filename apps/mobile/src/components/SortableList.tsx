import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderHandlers,
  PanResponder,
  PanResponderInstance,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

export interface SortableRenderItemProps<T> {
  item: T;
  index: number;
  isDragging: boolean;
  isDragOver?: boolean;
  dragHandleProps: GestureResponderHandlers | Record<string, unknown>;
}

export interface SortableListProps<T extends { id: string }> {
  items: T[];
  renderItem: (props: SortableRenderItemProps<T>) => React.ReactElement;
  onReorder: (fromId: string, toId: string) => void | Promise<void>;
  onDragStart?: (itemId: string) => void;
  onDragEnd?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Lista ordenable interactiva por arrastre (Drag & Drop) para móviles y web.
 * En Android/iOS: eleva el elemento seleccionado, sigue el dedo suavemente,
 * desplaza los demás elementos para abrir espacio y se asienta en la ranura destino al soltar.
 * En Web: integra los eventos nativos de HTML5 drag-and-drop.
 */
export function SortableList<T extends { id: string }>({
  items,
  renderItem,
  onReorder,
  onDragStart,
  onDragEnd,
  disabled = false,
  style,
  testID,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const itemsRef = useRef<T[]>(items);
  itemsRef.current = items;

  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;

  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const activeIndexRef = useRef<number>(-1);
  const hoverIndexRef = useRef<number>(-1);
  const isDraggingRef = useRef<boolean>(false);

  // Registro de dimensiones y posiciones Y de cada elemento
  const layoutsRef = useRef<Record<string, { y: number; height: number }>>({});

  // Animaciones del elemento activo
  const activeDragY = useRef(new Animated.Value(0)).current;
  const activeDragScale = useRef(new Animated.Value(1)).current;

  // Desplazamientos animados individuales de los demás elementos
  const shiftAnimsRef = useRef<Record<string, Animated.Value>>({});

  const getShiftAnim = useCallback((id: string) => {
    if (!shiftAnimsRef.current[id]) {
      shiftAnimsRef.current[id] = new Animated.Value(0);
    }
    return shiftAnimsRef.current[id];
  }, []);

  // Web drag state
  const [webDragOverId, setWebDragOverId] = useState<string | null>(null);

  // Limpieza sincronizada cuando cambian los items
  useEffect(() => {
    Object.values(shiftAnimsRef.current).forEach((anim) => anim.setValue(0));
    activeDragY.setValue(0);
    activeDragScale.setValue(1);
    isDraggingRef.current = false;
    activeIndexRef.current = -1;
    hoverIndexRef.current = -1;
    setActiveId(null);
  }, [items, activeDragScale, activeDragY]);

  const cleanup = useCallback(() => {
    isDraggingRef.current = false;
    activeIndexRef.current = -1;
    hoverIndexRef.current = -1;
    setActiveId(null);
    activeDragY.setValue(0);
    activeDragScale.setValue(1);

    Object.values(shiftAnimsRef.current).forEach((anim) => {
      anim.setValue(0);
    });

    onDragEndRef.current?.();
  }, [activeDragScale, activeDragY]);

  const finishDrag = useCallback(
    (dy: number) => {
      if (!isDraggingRef.current) return;

      const currentItems = itemsRef.current;
      const activeIdx = activeIndexRef.current;
      const hoverIdx = hoverIndexRef.current;

      // Toque simple sin arrastre significativo o soltado en la misma ranura: cancelar sin mover
      if (
        activeIdx < 0 ||
        hoverIdx < 0 ||
        activeIdx === hoverIdx ||
        Math.abs(dy) < 6 ||
        activeIdx >= currentItems.length ||
        hoverIdx >= currentItems.length
      ) {
        Animated.parallel([
          Animated.spring(activeDragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 320,
            friction: 26,
          }),
          Animated.spring(activeDragScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 320,
            friction: 26,
          }),
        ]).start(() => {
          cleanup();
        });
        return;
      }

      const fromItem = currentItems[activeIdx];
      const toItem = currentItems[hoverIdx];
      const fromLayout = layoutsRef.current[fromItem.id];
      const toLayout = layoutsRef.current[toItem.id];

      const targetY = toLayout && fromLayout ? toLayout.y - fromLayout.y : 0;

      Animated.parallel([
        Animated.spring(activeDragY, {
          toValue: targetY,
          useNativeDriver: true,
          tension: 320,
          friction: 26,
        }),
        Animated.spring(activeDragScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 320,
          friction: 26,
        }),
      ]).start(() => {
        const fromId = fromItem.id;
        const toId = toItem.id;
        cleanup();
        void onReorderRef.current?.(fromId, toId);
      });
    },
    [activeDragScale, activeDragY, cleanup],
  );

  const panRespondersRef = useRef<Record<string, PanResponderInstance>>({});

  const getPanResponder = useCallback(
    (itemId: string) => {
      if (panRespondersRef.current[itemId]) {
        return panRespondersRef.current[itemId];
      }

      const pr = PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onStartShouldSetPanResponderCapture: () => !disabledRef.current,
        onMoveShouldSetPanResponder: (_, gesture) => !disabledRef.current && Math.abs(gesture.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gesture) => !disabledRef.current && Math.abs(gesture.dy) > 2,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: () => {
          if (disabledRef.current) return;
          const currentItems = itemsRef.current;
          const currentIndex = currentItems.findIndex((it) => it.id === itemId);
          if (currentIndex < 0) return;

          activeIndexRef.current = currentIndex;
          hoverIndexRef.current = currentIndex;
          isDraggingRef.current = true;
          setActiveId(itemId);
          activeDragY.setValue(0);

          Animated.spring(activeDragScale, {
            toValue: 1.02,
            useNativeDriver: true,
            tension: 320,
            friction: 22,
          }).start();

          onDragStartRef.current?.(itemId);
        },

        onPanResponderMove: (_, gesture) => {
          if (!isDraggingRef.current || activeIndexRef.current < 0) return;

          activeDragY.setValue(gesture.dy);

          const currentItems = itemsRef.current;
          const n = currentItems.length;
          const activeIdx = activeIndexRef.current;
          const activeItem = currentItems[activeIdx];
          if (!activeItem) return;

          const activeLayout = layoutsRef.current[activeItem.id];
          if (!activeLayout) return;

          const initialCenter = activeLayout.y + activeLayout.height / 2;
          const currentCenter = initialCenter + gesture.dy;

          // Centros verticales de cada ranura
          const slotCenters: number[] = [];
          for (let i = 0; i < n; i++) {
            const layout = layoutsRef.current[currentItems[i].id];
            if (layout) {
              slotCenters.push(layout.y + layout.height / 2);
            } else {
              slotCenters.push(i * 72 + 36);
            }
          }

          // Ranura sobre la cual flota el elemento
          let newHoverIndex = 0;
          while (
            newHoverIndex < n - 1 &&
            currentCenter > (slotCenters[newHoverIndex] + slotCenters[newHoverIndex + 1]) / 2
          ) {
            newHoverIndex++;
          }

          newHoverIndex = Math.max(0, Math.min(n - 1, newHoverIndex));

          if (newHoverIndex !== hoverIndexRef.current) {
            hoverIndexRef.current = newHoverIndex;

            // Desplazar suavemente los demás elementos
            for (let k = 0; k < n; k++) {
              if (k === activeIdx) continue;
              const item_k = currentItems[k];
              if (!item_k) continue;

              const layout_k = layoutsRef.current[item_k.id];
              if (!layout_k) continue;

              let targetShift = 0;

              if (activeIdx < newHoverIndex) {
                // Arrastrando hacia abajo: los elementos entre activeIdx + 1 y newHoverIndex suben
                if (k > activeIdx && k <= newHoverIndex) {
                  const prevItem = currentItems[k - 1];
                  const prevLayout = prevItem ? layoutsRef.current[prevItem.id] : null;
                  if (prevLayout) {
                    targetShift = prevLayout.y - layout_k.y;
                  }
                }
              } else if (activeIdx > newHoverIndex) {
                // Arrastrando hacia arriba: los elementos entre newHoverIndex y activeIdx - 1 bajan
                if (k >= newHoverIndex && k < activeIdx) {
                  const nextItem = currentItems[k + 1];
                  const nextLayout = nextItem ? layoutsRef.current[nextItem.id] : null;
                  if (nextLayout) {
                    targetShift = nextLayout.y - layout_k.y;
                  }
                }
              }

              const anim = getShiftAnim(item_k.id);
              Animated.spring(anim, {
                toValue: targetShift,
                useNativeDriver: true,
                tension: 320,
                friction: 28,
              }).start();
            }
          }
        },

        onPanResponderRelease: (_, gesture) => {
          finishDrag(gesture.dy);
        },

        onPanResponderTerminate: () => {
          finishDrag(0);
        },
      });

      panRespondersRef.current[itemId] = pr;
      return pr;
    },
    [activeDragScale, activeDragY, finishDrag, getShiftAnim],
  );

  const isWeb = Platform.OS === 'web';

  return (
    <View style={style} testID={testID}>
      {items.map((item, index) => {
        const isDragging = activeId === item.id;
        const shiftAnim = getShiftAnim(item.id);
        const pr = getPanResponder(item.id);

        const animatedStyle = isDragging
          ? {
              transform: [
                { translateY: activeDragY },
                { scale: activeDragScale },
              ],
              zIndex: 999,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
            }
          : {
              transform: [{ translateY: shiftAnim }],
              zIndex: 1,
              elevation: 0,
            };

        const webDragProps = isWeb
          ? {
              draggable: !disabled,
              onDragStart: (e: any) => {
                if (disabled) return;
                e.dataTransfer?.setData('text/plain', item.id);
                onDragStartRef.current?.(item.id);
              },
              onDragOver: (e: any) => {
                e.preventDefault?.();
                setWebDragOverId(item.id);
              },
              onDrop: (e: any) => {
                e.preventDefault?.();
                const fromId = e.dataTransfer?.getData('text/plain');
                setWebDragOverId(null);
                if (fromId && fromId !== item.id) {
                  void onReorderRef.current?.(fromId, item.id);
                }
                onDragEndRef.current?.();
              },
              onDragEnd: () => {
                setWebDragOverId(null);
                onDragEndRef.current?.();
              },
            }
          : {};

        return (
          <Animated.View
            key={item.id}
            onLayout={(e) => {
              layoutsRef.current[item.id] = {
                y: e.nativeEvent.layout.y,
                height: e.nativeEvent.layout.height,
              };
            }}
            style={animatedStyle}
            {...webDragProps}
          >
            {renderItem({
              item,
              index,
              isDragging,
              isDragOver: isWeb && webDragOverId === item.id,
              dragHandleProps: isWeb ? {} : pr.panHandlers,
            })}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({});
