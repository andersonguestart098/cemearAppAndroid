import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";

interface Ferias {
  id: string;
  name: string;
  startDate: string;
  returnDate: string;
}

const CalendarHolidays: React.FC = () => {
  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [employee, setEmployee] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Função para buscar férias do backend
  const fetchFerias = async () => {
    try {
      const response = await axios.get("https://cemear-b549eb196d7c.herokuapp.com/ferias");
      const data = response.data;

      // Marca os dias de férias no calendário
      const marked = data.reduce((acc: Record<string, any>, ferias: Ferias) => {
        let currentDate = new Date(ferias.startDate);
        const endDate = new Date(ferias.returnDate);

        while (currentDate <= endDate) {
          const formattedDate = currentDate.toISOString().split("T")[0];
          acc[formattedDate] = { marked: true, dotColor: "green" };
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return acc;
      }, {});

      setFerias(data);
      setMarkedDates(marked);
    } catch (error) {
      console.error("Erro ao buscar férias:", error);
      Alert.alert("Erro", "Não foi possível carregar as férias.");
    }
  };

  useEffect(() => {
    fetchFerias();
  }, []);

  // Adicionar novas férias
  const handleAddFerias = async () => {
    if (!employee.trim() || !startDate || !endDate) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const response = await axios.post("https://cemear-b549eb196d7c.herokuapp.com/ferias", {
        name: employee,
        startDate: formattedStartDate,
        returnDate: formattedEndDate,
      });

      const newFerias = response.data;
      setFerias((prev) => [...prev, newFerias]);

      let currentDate = new Date(formattedStartDate);
      while (currentDate <= new Date(formattedEndDate)) {
        const formattedDate = currentDate.toISOString().split("T")[0];
        setMarkedDates((prev) => ({
          ...prev,
          [formattedDate]: { marked: true, dotColor: "green" },
        }));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setEmployee("");
      setStartDate(null);
      setEndDate(null);
      Alert.alert("Sucesso", "Férias adicionadas com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar férias:", error);
      Alert.alert("Erro", "Não foi possível adicionar as férias.");
    }
  };

  // Clique em uma data
  const onDayPress = (day: DateData) => {
    const feriasDia = ferias.filter(
      (f) =>
        new Date(f.startDate).toISOString().split("T")[0] <= day.dateString &&
        new Date(f.returnDate).toISOString().split("T")[0] >= day.dateString
    );

    if (feriasDia.length > 0) {
      Alert.alert(
        "Férias",
        feriasDia.map((f) => `${f.name}: ${f.startDate} - ${f.returnDate}`).join("\n")
      );
    } else {
      Alert.alert("Sem férias", "Nenhuma férias para esta data.");
    }
  };

  // Filtrar férias do mês atual
  const currentMonth = new Date().toISOString().split("T")[0].slice(0, 7);
  const monthlyFerias = ferias.filter((f) =>
    f.startDate.startsWith(currentMonth) || f.returnDate.startsWith(currentMonth)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendário de Férias</Text>

      {/* Calendário */}
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          selectedDayBackgroundColor: "#007AFF",
          todayTextColor: "#007AFF",
          arrowColor: "#007AFF",
        }}
      />

      {/* Inputs para adicionar férias */}
      <TextInput
        placeholder="Nome do Colaborador"
        value={employee}
        onChangeText={setEmployee}
        style={styles.input}
      />
      <Button title="Selecionar Data de Início" onPress={() => setShowStartPicker(true)} />
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}
      <Text style={styles.selectedDate}>
        Data de Início: {startDate?.toLocaleDateString("pt-BR") || "Não selecionada"}
      </Text>
      <Button title="Selecionar Data de Término" onPress={() => setShowEndPicker(true)} />
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
      <Text style={styles.selectedDate}>
        Data de Término: {endDate?.toLocaleDateString("pt-BR") || "Não selecionada"}
      </Text>
      <Button title="Adicionar Férias" onPress={handleAddFerias} />

      {/* Lista de férias do mês */}
      <Text style={styles.subtitle}>Férias do Mês</Text>
      <FlatList
        data={monthlyFerias}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventItem}>
            <Text style={styles.eventDescription}>{item.name}</Text>
            <Text style={styles.eventDate}>
              {new Date(item.startDate).toLocaleDateString("pt-BR")} -{" "}
              {new Date(item.returnDate).toLocaleDateString("pt-BR")}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 2,
  },
  selectedDate: {
    marginVertical: 10,
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
  },
  eventItem: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 5,
    marginVertical: 5,
  },
  eventDescription: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventDate: {
    fontSize: 14,
    color: "#555",
  },
});

export default CalendarHolidays;
