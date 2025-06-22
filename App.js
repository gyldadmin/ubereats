import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('Testing connection...');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('_dummy_table_that_doesnt_exist')
          .select('*')
          .limit(1);
        
        if (error && error.code === 'PGRST116') {
          // This error means connection works but table doesn't exist (which is expected)
          setConnectionStatus('✅ Supabase connected successfully!');
        } else {
          setConnectionStatus('❌ Connection failed: ' + error?.message);
        }
      } catch (err) {
        setConnectionStatus('❌ Connection error: ' + err.message);
      }
    }
    
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text>{connectionStatus}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});