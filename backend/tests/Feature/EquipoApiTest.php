<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();

    $respuesta = $this->postJson('/api/equipos', [
        'codigo'            => 'EQ-0100',
        'nombre'            => 'Proyector Epson PowerLite X49',
        'categoria_id'      => $categoria->id,
        'fecha_adquisicion' => '2026-01-15',
        'costo_interno'     => 350000,
    ]);

    $equipo = Equipo::where('codigo', 'EQ-0100')->first();

    $respuesta->assertCreated()
        ->assertHeader('Location', route('equipos.show', $equipo))
        ->assertJsonPath('data.codigo', 'EQ-0100')
        ->assertJsonPath('data.estado', 'disponible')
        ->assertJsonPath('data.categoria.id', $categoria->id)
        ->assertJsonMissingPath('data.costo_interno');

    $this->assertDatabaseHas('equipos', ['codigo' => 'EQ-0100', 'categoria_id' => $categoria->id]);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $this->postJson('/api/equipos', [
        'codigo'            => 'ABC-1',
        'nombre'            => 'PC',
        'categoria_id'      => 999,
        'estado'            => 'prestado',
        'fecha_adquisicion' => now()->addDay()->toDateString(),
        'costo_interno'     => -5,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo'            => 'El código debe tener el formato EQ-0000.',
            'nombre'            => 'El nombre debe tener al menos 3 caracteres.',
            'categoria_id'      => 'La categoría seleccionada no existe.',
            'estado'            => 'El estado solo puede ser disponible o mantenimiento.',
            'fecha_adquisicion' => 'La fecha de adquisición no puede ser futura.',
            'costo_interno'     => 'El costo interno debe ser mayor o igual a 0.',
        ]);

    $this->assertDatabaseCount('equipos', 0);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->prestado()->create();

    $this->deleteJson("/api/equipos/{$equipo->id}")
        ->assertStatus(409)
        ->assertExactJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo'  => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id, 'estado' => 'prestado']);
});
