package com.satyansh.gogetthetickets.common;

import java.util.Arrays;
import java.util.List;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Stores short lists (genres, languages, formats) as one comma-separated column. */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

	@Override
	public String convertToDatabaseColumn(List<String> values) {
		return values == null ? null : String.join(",", values);
	}

	@Override
	public List<String> convertToEntityAttribute(String column) {
		if (column == null || column.isBlank()) {
			return List.of();
		}
		return Arrays.stream(column.split(",")).map(String::trim).toList();
	}

}
