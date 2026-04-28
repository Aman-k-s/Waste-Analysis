# Analytics Query Examples

These are the ORM patterns used by the backend to avoid exposing raw tables directly.

## Dashboard Summary

```python
queryset.aggregate(
    total_waste=Sum("weight"),
    total_scans=Count("id"),
    total_devices=Count("device_id", distinct=True),
)
```

```python
Count(
    Case(
        When(Q(is_abnormal=True), then=TruncDate("captured_at")),
    ),
    distinct=True,
)
```

```python
ExpressionWrapper(
    Coalesce(F("weight"), 0) * Coalesce(F("unit_cost"), F("waste_type__unit_cost"), 0),
    output_field=DecimalField(max_digits=18, decimal_places=2),
)
```

## Waste By Category

```python
queryset.values(category=F("waste_type__name")).annotate(
    value=Sum("weight")
).order_by("-value", "category")
```

## Reason Breakdown

```python
queryset.filter(waste_type__name=category).values(reason=F("reason__name")).annotate(
    value=Sum("weight")
)
```

## Moisture Data

```python
queryset.values("sample_id", "moisture", "temperature", "weight").order_by("-captured_at")[:250]
```
