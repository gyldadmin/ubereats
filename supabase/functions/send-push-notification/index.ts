import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "npm:expo-server-sdk@3.7.0";

interface PushNotificationRequest {
  tokens: string[];
  title: string;
  subtitle?: string;
  body: string;
  data?: Record<string, any>;
  richContent?: {
    image?: string;
  };
}

interface PushNotificationResponse {
  success: boolean;
  successful: string[];
  failed: Array<{token: string, error: string}>;
  ticketIds: string[];
  message: string;
}

const expo = new Expo();

Deno.serve(async (req: Request): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Parse request body
    const requestData: PushNotificationRequest = await req.json();
    
    console.log('Push notification request received', {
      tokenCount: requestData.tokens.length,
      title: requestData.title
    });

    // Validate request
    if (!requestData.tokens || requestData.tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No tokens provided',
          successful: [],
          failed: [],
          ticketIds: [],
          message: 'No tokens to send to'
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!requestData.title || !requestData.body) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Title and body are required',
          successful: [],
          failed: [],
          ticketIds: [],
          message: 'Missing required fields'
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter valid Expo push tokens
    const validTokens = requestData.tokens.filter(token => Expo.isExpoPushToken(token));
    
    if (validTokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No valid Expo push tokens provided',
          successful: [],
          failed: requestData.tokens.map(token => ({ token, error: 'Invalid token format' })),
          ticketIds: [],
          message: 'No valid tokens found'
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build push messages
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      title: requestData.title,
      subtitle: requestData.subtitle,
      body: requestData.body,
      data: requestData.data || {},
      sound: 'default',
      priority: 'high' as const,
      // Add rich content with image if provided
      ...(requestData.richContent?.image && {
        richContent: {
          image: requestData.richContent.image
        }
      })
    }));

    console.log('Sending push notifications', { messageCount: messages.length });

    // Send push notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log('Chunk sent successfully', { chunkSize: chunk.length });
      } catch (chunkError) {
        console.error('Error sending push notification chunk', chunkError);
        // Create failed tickets for this chunk
        chunk.forEach(() => {
          tickets.push({
            status: 'error',
            details: {
              error: 'ChunkSendError'
            }
          } as ExpoPushTicket);
        });
      }
    }

    // Process results
    const successful: string[] = [];
    const failed: Array<{token: string, error: string}> = [];
    const ticketIds: string[] = [];

    tickets.forEach((ticket, index) => {
      const token = validTokens[index];
      
      if (ticket.status === 'ok') {
        successful.push(token);
        // Some tickets have IDs, collect them for receipt checking
        if ('id' in ticket && ticket.id) {
          ticketIds.push(ticket.id as string);
        }
      } else {
        failed.push({
          token,
          error: ticket.details?.error || 'Unknown push error'
        });
      }
    });

    // Add invalid tokens to failed list
    const invalidTokens = requestData.tokens.filter(token => !Expo.isExpoPushToken(token));
    invalidTokens.forEach(token => {
      failed.push({
        token,
        error: 'Invalid token format'
      });
    });

    const response: PushNotificationResponse = {
      success: successful.length > 0,
      successful,
      failed,
      ticketIds,
      message: `Push sent to ${successful.length}/${requestData.tokens.length} tokens`
    };

    console.log('Push notification results', {
      successful: successful.length,
      failed: failed.length,
      total: requestData.tokens.length
    });

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        } 
      }
    );

  } catch (error) {
    console.error('Error in push notification function', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        successful: [],
        failed: [],
        ticketIds: [],
        message: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}); 