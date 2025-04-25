                <div class="mb-4">
                    <label for="location" class="block text-gray-700 text-sm font-bold mb-2">開催場所</label>
                    <input type="text" name="location" id="location" value="{{ old('location') }}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                </div>

                <div class="mb-4">
                    <label for="prefecture" class="block text-gray-700 text-sm font-bold mb-2">開催都道府県</label>
                    <select name="prefecture" id="prefecture" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                        <option value="">選択してください</option>
                        @foreach($prefectures as $prefecture)
                            <option value="{{ $prefecture }}" {{ old('prefecture') == $prefecture ? 'selected' : '' }}>
                                {{ $prefecture }}
                            </option>
                        @endforeach
                    </select>
                </div> 