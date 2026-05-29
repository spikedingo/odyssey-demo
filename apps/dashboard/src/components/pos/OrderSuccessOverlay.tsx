import { Button, Modal, fontFamily } from '@odyssey/ui';
import { CheckCircle2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type OrderSuccessOverlayProps = {
  orderId: number | null;
  onDismiss: () => void;
};

const AUTO_DISMISS_SECONDS = 60;

export function OrderSuccessOverlay({ orderId, onDismiss }: OrderSuccessOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_DISMISS_SECONDS);

  useEffect(() => {
    if (!orderId) return;

    setSecondsLeft(AUTO_DISMISS_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderId, onDismiss]);

  if (!orderId) return null;

  return (
    <Modal open title="" onClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <CheckCircle2 color="#2d4a3e" size={64} />
        <Text style={styles.title}>Order Submitted!</Text>
        <Text style={styles.orderId}>Order #{orderId}</Text>
        <Text style={styles.hint}>Please wait for your order number to be called.</Text>
        <Text style={styles.countdown}>Starting new order in {secondsLeft}s</Text>
        <Button size="lg" style={styles.btn} onPress={onDismiss}>
          Start New Order
        </Button>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  title: { fontFamily: fontFamily.sansBold, fontSize: 28, color: '#1a1816' },
  orderId: { fontFamily: fontFamily.sansBold, fontSize: 22, color: '#2d4a3e' },
  hint: { fontFamily: fontFamily.sans, fontSize: 16, color: '#6b6560', textAlign: 'center' },
  countdown: { fontFamily: fontFamily.sans, fontSize: 14, color: '#6b6560', marginTop: 8 },
  btn: { marginTop: 16, minWidth: 200 },
});
