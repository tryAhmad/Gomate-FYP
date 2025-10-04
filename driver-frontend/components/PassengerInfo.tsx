import React from 'react';
import { View, Text, Image } from 'react-native';

interface PassengerInfoProps {
  name?: string;
  profilePhoto?: string;
  timeAway?: string;
  fare?: string | number;
  showFare?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const PassengerInfo: React.FC<PassengerInfoProps> = ({
  name,
  profilePhoto,
  timeAway,
  fare,
  showFare = true,
  size = 'medium',
}) => {
  const getInitial = (passengerName?: string) => 
    passengerName?.charAt(0).toUpperCase() || 'P';

  const getAvatarSize = () => {
    switch (size) {
      case 'small': return { width: 40, height: 40, fontSize: 16 };
      case 'large': return { width: 60, height: 60, fontSize: 24 };
      default: return { width: 50, height: 50, fontSize: 20 };
    }
  };

  const avatarSize = getAvatarSize();

  return (
    <View style={styles.passengerRow}>
      {profilePhoto ? (
        <Image 
          source={{ uri: profilePhoto }} 
          style={[styles.avatar, avatarSize]} 
        />
      ) : (
        <View style={[styles.avatarPlaceholder, avatarSize]}>
          <Text style={[styles.avatarInitial, { fontSize: avatarSize.fontSize }]}>
            {getInitial(name)}
          </Text>
        </View>
      )}
      <View style={styles.passengerInfo}>
        <Text style={[
          styles.passengerName, 
          size === 'small' && styles.smallText,
          size === 'large' && styles.largeText
        ]}>
          {name || 'Passenger'}
        </Text>
        {timeAway && (
          <Text style={[
            styles.timeAwayText,
            size === 'small' && styles.smallSubText
          ]}>
            {timeAway}
          </Text>
        )}
      </View>
      {showFare && fare && (
        <Text style={[
          styles.fareText,
          size === 'small' && styles.smallFare,
          size === 'large' && styles.largeFare
        ]}>
          Rs {fare}
        </Text>
      )}
    </View>
  );
};

const styles = {
  passengerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  avatar: {
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarInitial: {
    color: '#0286FF',
    fontWeight: '600' as const,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
  },
  timeAwayText: {
    fontSize: 12,
    color: 'grey',
    marginTop: 2,
  },
  fareText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  smallText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 20,
  },
  smallSubText: {
    fontSize: 10,
  },
  smallFare: {
    fontSize: 16,
  },
  largeFare: {
    fontSize: 24,
  },
};