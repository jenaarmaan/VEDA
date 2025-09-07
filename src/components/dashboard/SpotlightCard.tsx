
'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SpotlightItem } from "@/lib/types";
import { CheckCircle, XCircle } from "lucide-react";

interface SpotlightCardProps {
  item: SpotlightItem;
}

export default function SpotlightCard({ item }: SpotlightCardProps) {
  const isReal = item.type === 'real';

  return (
    <Card className="bg-card/80 hover:bg-card/90 transition-all border-l-4" style={{ borderLeftColor: isReal ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
          <Badge variant={isReal ? "default" : "destructive"} className={isReal ? 'bg-green-600' : ''}>
            {isReal ? <CheckCircle className="h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
            {isReal ? 'Real News' : 'Fake News'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{item.summary}</p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground font-medium">Source: {item.source}</p>
      </CardFooter>
    </Card>
  );
}

    