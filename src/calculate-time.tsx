import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Clipboard,
  Icon,
} from "@raycast/api";
import { useState, useMemo } from "react";

interface TimeEntry {
  id: string;
  value: string;
  minutes: number | null;
  isValid: boolean;
  errorMessage?: string;
}

// Create initial empty entries
const createEmptyEntries = (count: number): TimeEntry[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `entry-${Date.now()}-${index}`,
    value: "",
    minutes: null,
    isValid: true,
  }));
};

export default function CalculateTime() {
  const [entries, setEntries] = useState<TimeEntry[]>(createEmptyEntries(10));
  const [isLoading, setIsLoading] = useState(false);

  // Parse time input and return minutes
  const parseTimeInput = (input: string): { minutes: number | null; isValid: boolean; errorMessage?: string } => {
    if (!input.trim()) {
      return { minutes: null, isValid: true };
    }

    // Check if it's time format (contains :)
    if (input.includes(":")) {
      const parts = input.split(":");
      if (parts.length !== 2) {
        return { minutes: null, isValid: false, errorMessage: "Invalid format. Use HH:MM" };
      }

      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);

      if (isNaN(hours) || isNaN(minutes)) {
        return { minutes: null, isValid: false, errorMessage: "Invalid time values" };
      }

      if (hours < 0) {
        return { minutes: null, isValid: false, errorMessage: "Hours cannot be negative" };
      }

      if (minutes < 0 || minutes > 59) {
        return { minutes: null, isValid: false, errorMessage: "Minutes must be between 0-59" };
      }

      return { minutes: hours * 60 + minutes, isValid: true };
    }

    // Decimal format
    const decimal = parseFloat(input);
    if (isNaN(decimal)) {
      return { minutes: null, isValid: false, errorMessage: "Invalid decimal format" };
    }

    if (decimal < 0) {
      return { minutes: null, isValid: false, errorMessage: "Time cannot be negative" };
    }

    return { minutes: Math.round(decimal * 60), isValid: true };
  };

  // Format minutes to HH:MM
  const formatTimeDisplay = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  // Format minutes to decimal
  const formatDecimalDisplay = (totalMinutes: number): string => {
    return (totalMinutes / 60).toFixed(3);
  };

  // Handle input change
  const handleInputChange = (id: string, value: string) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        
        const parsed = parseTimeInput(value);
        return {
          ...entry,
          value,
          minutes: parsed.minutes,
          isValid: parsed.isValid,
          errorMessage: parsed.errorMessage,
        };
      })
    );
  };

  // Calculate total minutes
  const totalMinutes = useMemo(() => {
    return entries.reduce((sum, entry) => {
      return sum + (entry.minutes || 0);
    }, 0);
  }, [entries]);

  // Add more lines
  const handleAddMoreLines = () => {
    setEntries((prev) => [...prev, ...createEmptyEntries(5)]);
    showToast({
      style: Toast.Style.Success,
      title: "Added 5 more lines",
    });
  };

  // Clear all entries
  const handleClear = () => {
    setEntries(createEmptyEntries(10));
    showToast({
      style: Toast.Style.Success,
      title: "Cleared all entries",
    });
  };

  // Copy total to clipboard
  const handleCopyTotal = async () => {
    try {
      const timeFormat = formatTimeDisplay(totalMinutes);
      const decimalFormat = formatDecimalDisplay(totalMinutes);
      const clipboardContent = `Total: ${timeFormat} (${decimalFormat} hours)`;
      
      await Clipboard.copy(clipboardContent);
      await showToast({
        style: Toast.Style.Success,
        title: "Copied to clipboard",
        message: clipboardContent,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to copy",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Time Calculator"
      actions={
        <ActionPanel>
          <Action
            title="Copy Total"
            icon={Icon.CopyClipboard}
            onAction={handleCopyTotal}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action
            title="Clear All"
            icon={Icon.Trash}
            onAction={handleClear}
            shortcut={{ modifiers: ["cmd"], key: "k" }}
          />
          <Action
            title="Add More Lines"
            icon={Icon.Plus}
            onAction={handleAddMoreLines}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Total Time"
        text={`${formatTimeDisplay(totalMinutes)} (${formatDecimalDisplay(totalMinutes)} hours)`}
      />
      
      <Form.Separator />
      
      {entries.map((entry, index) => (
        <Form.TextField
          key={entry.id}
          id={entry.id}
          title={`Entry ${index + 1}`}
          placeholder="e.g., 8:30 or 8.5"
          value={entry.value}
          error={entry.isValid ? undefined : entry.errorMessage}
          onChange={(value) => handleInputChange(entry.id, value)}
          storeValue={false}
        />
      ))}
    </Form>
  );
}
